import { Buffer } from "node:buffer";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import React from "react";
import { parseDSL } from "../lib/parser.js";
import { Diagram } from "../components/diagram/diagram.jsx";
import { THEMES } from "../lib/themes.js";

const MAX_BODY_BYTES = 1_000_000;
const PNG_SCALE = 2;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error("body_too_large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

function normalizePathname(pathname) {
  if (!pathname) return "/";
  const withoutQuery = pathname.split("?")[0] || "/";
  return withoutQuery.endsWith("/") && withoutQuery.length > 1
    ? withoutQuery.slice(0, -1)
    : withoutQuery;
}

function stripAppBase(pathname, base) {
  if (!base || base === "/") return pathname;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  if (pathname === b) return "/";
  if (pathname.startsWith(`${b}/`)) return pathname.slice(b.length) || "/";
  return pathname;
}

function getThemeKey(url) {
  try {
    const q = new URL(url, "http://local").searchParams.get("theme");
    if (q && THEMES[q]) return q;
  } catch {
    // ignore
  }
  return "basic";
}

function viewBoxSize(svgMarkup) {
  const m = svgMarkup.match(/viewBox=["']\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (!m) return { w: 800, h: 600 };
  return { w: Number(m[1]) || 800, h: Number(m[2]) || 600 };
}

function scanDslMarkers(dsl) {
  const lines = String(dsl).split(/\r?\n/);
  let hasStart = false;
  let hasEnd = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === "@kai-swimlane") hasStart = true;
    if (t === "@end") hasEnd = true;
  }
  return { hasStart, hasEnd };
}

function formatDslErrorMessage(errors) {
  if (!errors?.length) return "DSL format error.";
  const lines = errors.map((e) => {
    const snippet =
      e.text != null && String(e.text).trim()
        ? ` — ${String(e.text).trim().slice(0, 120)}`
        : "";
    return `Line ${e.line}: ${e.msg}${snippet}`;
  });
  return `DSL format error:\n${lines.join("\n")}`;
}

/**
 * Validates DSL structure and parses content. Does not render PNG.
 * @param {string} dsl
 * @returns {{ ok: true, model: object } | { ok: false, error: string, errors?: object[] }}
 */
export function validateDslForLlm(dsl) {
  const text = String(dsl ?? "");
  if (!text.trim()) {
    return { ok: false, error: "DSL format error: document is empty." };
  }

  const { hasStart, hasEnd } = scanDslMarkers(text);
  const model = parseDSL(text);

  if (!hasStart) {
    if (model.errors?.length) {
      return {
        ok: false,
        error: formatDslErrorMessage(model.errors),
        errors: model.errors,
      };
    }
    return {
      ok: false,
      error: "DSL format error: missing required start marker line `@kai-swimlane`.",
    };
  }

  if (!hasEnd) {
    return {
      ok: false,
      error: "DSL format error: missing required closing marker line `@end`.",
    };
  }

  if (model.errors?.length) {
    return {
      ok: false,
      error: formatDslErrorMessage(model.errors),
      errors: model.errors,
    };
  }

  return { ok: true, model };
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function modelToPngBuffer(model, themeKey) {
  const theme = THEMES[themeKey] || THEMES.basic;

  const markup = renderToStaticMarkup(
    React.createElement(Diagram, { model, theme })
  );
  let svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + markup;
  if (!svg.includes("xmlns:xlink")) {
    svg = svg.replace("<svg ", '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
  }

  const { w, h } = viewBoxSize(markup);
  const outW = Math.max(1, Math.round(w * PNG_SCALE));
  const outH = Math.max(1, Math.round(h * PNG_SCALE));

  return sharp(Buffer.from(svg, "utf8"), { density: 144 })
    .resize(outW, outH)
    .flatten({ background: theme.bg })
    .png()
    .toBuffer();
}

function pngJsonSuccess(pngBuffer) {
  return {
    success: true,
    pngBase64: pngBuffer.toString("base64"),
    mimeType: "image/png",
  };
}

/**
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {string} pathnameWithQuery — `req.url` (may include query)
 * @param {string} appBase — Vite `config.base` (e.g. `/swimlane-app/`)
 * @returns {Promise<boolean>} true if the request was fully handled
 */
export async function handleLlmRoute(req, res, pathnameWithQuery, appBase) {
  const pathname = stripAppBase(
    normalizePathname(pathnameWithQuery.split("?")[0]),
    appBase.endsWith("/") ? appBase.slice(0, -1) : appBase
  );

  if (pathname !== "/llm" && !pathname.startsWith("/llm/")) {
    return false;
  }

  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  if (pathname === "/llm" || pathname === "/llm/") {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Allow", "GET, OPTIONS");
      res.end("Method Not Allowed");
      return true;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        success: true,
        endpoints: {
          "POST /llm/png": {
            description:
              "Validate DSL and render PNG. Response is always JSON with boolean `success`.",
            response: {
              success_true:
                "{ success: true, pngBase64: string, mimeType: \"image/png\" }",
              success_false:
                "{ success: false, error: string } — `error` is the DSL format or request message; optional `errors` array for parser rows.",
            },
            body: [
              "text/plain: raw DSL including @kai-swimlane … @end",
              'application/json: { "dsl": "<string>" }',
            ],
            query: {
              theme: `one of: ${Object.keys(THEMES).join(", ")} (default: basic)`,
            },
          },
        },
      })
    );
    return true;
  }

  if (pathname === "/llm/png") {
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Allow", "POST, OPTIONS");
      res.end("Method Not Allowed");
      return true;
    }

    const themeKey = getThemeKey(pathnameWithQuery);
    let dsl;

    try {
      const raw = await readBody(req, MAX_BODY_BYTES);
      const ct = (req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      if (ct === "application/json") {
        const parsed = JSON.parse(raw || "{}");
        if (typeof parsed.dsl !== "string") {
          sendJson(res, 200, {
            success: false,
            error:
              'DSL format error: JSON body must include a string property `"dsl"`.',
          });
          return true;
        }
        dsl = parsed.dsl;
      } else {
        dsl = raw;
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        sendJson(res, 200, {
          success: false,
          error: "DSL format error: JSON body is not valid JSON.",
        });
        return true;
      }
      if (e.message === "body_too_large") {
        sendJson(res, 200, {
          success: false,
          error: "Request body is too large; reduce DSL size and try again.",
        });
        return true;
      }
      sendJson(res, 200, {
        success: false,
        error: `DSL format error: could not read request body (${String(e.message)}).`,
      });
      return true;
    }

    if (!String(dsl ?? "").trim()) {
      sendJson(res, 200, {
        success: false,
        error: "DSL format error: document is empty.",
      });
      return true;
    }

    const validated = validateDslForLlm(dsl);
    if (!validated.ok) {
      sendJson(res, 200, {
        success: false,
        error: validated.error,
        ...(validated.errors?.length ? { errors: validated.errors } : {}),
      });
      return true;
    }

    try {
      const png = await modelToPngBuffer(validated.model, themeKey);
      sendJson(res, 200, pngJsonSuccess(png));
    } catch (e) {
      console.error("[llm/png]", e);
      sendJson(res, 200, {
        success: false,
        error: `PNG render failed: ${String(e.message)}`,
      });
    }
    return true;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ success: false, error: "Not found." }));
  return true;
}
