import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  parseDSL,
  Diagram,
  PartsPreviewStatic,
  THEMES,
} from "@kai-swimlane/core";

const LANG_FULL = "kai-swimlane";
const LANG_PARTS = "kai-swimlane-parts";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapFencePreview(bodyHtml, code, background) {
  const escaped = escapeHtml(code);
  return (
    `<div class="kai-swimlane-fence" style="margin:1rem 0;border:1px solid var(--vscode-panel-border,#d6d3d1);border-radius:6px;overflow:hidden;background:${background}">` +
    `<div class="kai-swimlane-fence__preview" style="overflow:auto;max-height:70vh;padding:4px">${bodyHtml}</div>` +
    `<details class="kai-swimlane-fence__source" style="border-top:1px solid var(--vscode-panel-border,#d6d3d1)">` +
    `<summary style="cursor:pointer;padding:6px 10px;font-size:12px;color:var(--vscode-descriptionForeground,#78716c)">DSL</summary>` +
    `<pre style="margin:0;padding:10px 12px;overflow:auto;font-size:11px;line-height:1.45;background:var(--vscode-textCodeBlock-background,#1c1917);color:var(--vscode-editor-foreground,#e7e5e4)"><code>${escaped}</code></pre>` +
    `</details></div>`
  );
}

function errorHtml(message, code) {
  return wrapFencePreview(
    `<p style="color:#b91c1c;font-size:12px;margin:12px">${escapeHtml(message)}</p>`,
    code,
    "#fafaf9"
  );
}

export function renderKaiSwimlaneFence(code, themeKey) {
  const theme = THEMES[themeKey] || THEMES.basic;
  const model = parseDSL(code);

  if (model.errors?.length) {
    return errorHtml(model.errors[0].msg, code);
  }

  const diagramMarkup = renderToStaticMarkup(
    React.createElement(Diagram, {
      model,
      theme,
      showStepBlockCaptions: false,
    })
  );

  return wrapFencePreview(diagramMarkup, code, theme.bg);
}

export function renderKaiSwimlanePartsFence(code, themeKey) {
  const theme = THEMES[themeKey] || THEMES.basic;
  const body = renderToStaticMarkup(
    React.createElement(PartsPreviewStatic, { code, theme })
  );

  return wrapFencePreview(body, code, theme.bg);
}

/**
 * @param {import("markdown-it")} md
 * @param {() => string} getThemeKey
 */
export function setupKaiSwimlaneMd(md, getThemeKey) {
  const defaultFence =
    md.renderer.rules.fence ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const lang = (token.info || "").trim().split(/\s+/)[0];

    if (lang === LANG_FULL || lang === LANG_PARTS) {
      const themeKey = getThemeKey();
      const code = token.content.replace(/\n$/, "");
      try {
        if (lang === LANG_FULL) {
          return renderKaiSwimlaneFence(code, themeKey);
        }
        return renderKaiSwimlanePartsFence(code, themeKey);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return errorHtml(msg, code);
      }
    }

    return defaultFence(tokens, idx, options, env, self);
  };

  return md;
}
