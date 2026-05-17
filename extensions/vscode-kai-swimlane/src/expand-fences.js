import {
  renderKaiSwimlaneFence,
  renderKaiSwimlanePartsFence,
} from "./render-fences.js";

const FENCE_RE =
  /```(kai-swimlane(?:-parts)?)[ \t]*\r?\n([\s\S]*?)```/g;

/**
 * Replace kai-swimlane fences with pre-rendered HTML (for MPE, PDF tools, etc.).
 * @param {string} markdown
 * @param {{ theme?: string }} [options]
 */
export function expandFencesInMarkdown(markdown, options = {}) {
  const themeKey = options.theme ?? "basic";
  return String(markdown ?? "").replace(FENCE_RE, (_match, lang, code) => {
    const body = code.replace(/\n$/, "");
    const html =
      lang === "kai-swimlane-parts"
        ? renderKaiSwimlanePartsFence(body, themeKey)
        : renderKaiSwimlaneFence(body, themeKey);
    return `\n\n${html}\n\n`;
  });
}
