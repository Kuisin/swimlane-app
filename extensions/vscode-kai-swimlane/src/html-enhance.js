import { expandFencesInMarkdown } from "./expand-fences.js";
import {
  renderKaiSwimlaneFence,
  renderKaiSwimlanePartsFence,
} from "./render-fences.js";

const LANG_FULL = "kai-swimlane";
const LANG_PARTS = "kai-swimlane-parts";

function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

function stripHtmlTags(html) {
  return String(html).replace(/<[^>]+>/g, "");
}

function extractCodeFromBlockInner(innerHtml) {
  const codeMatch = innerHtml.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
  const raw = codeMatch ? codeMatch[1] : innerHtml;
  return decodeHtmlEntities(stripHtmlTags(raw)).replace(/\n$/, "");
}

/**
 * Post-process HTML from Markdown Preview Enhanced / similar tools.
 * @param {string} html
 * @param {{ theme?: string }} [options]
 */
export function enhanceHtml(html, options = {}) {
  const themeKey = options.theme ?? "basic";
  let out = String(html ?? "");

  const blockPatterns = [
    {
      lang: LANG_FULL,
      render: (code) => renderKaiSwimlaneFence(code, themeKey),
    },
    {
      lang: LANG_PARTS,
      render: (code) => renderKaiSwimlanePartsFence(code, themeKey),
    },
  ];

  for (const { lang, render } of blockPatterns) {
    const classPattern = lang.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const mpeBlockRe = new RegExp(
      `<div[^>]*data-role=["']codeBlock["'][^>]*\\blanguage-${classPattern}\\b[^>]*>[\\s\\S]*?</div>`,
      "gi"
    );
    out = out.replace(mpeBlockRe, (block) => {
      try {
        return render(extractCodeFromBlockInner(block));
      } catch {
        return block;
      }
    });

    const preCodeRe = new RegExp(
      `<pre[^>]*>\\s*<code[^>]*\\blanguage-${classPattern}\\b[^>]*>([\\s\\S]*?)</code>\\s*</pre>`,
      "gi"
    );
    out = out.replace(preCodeRe, (_block, inner) => {
      try {
        const code = extractCodeFromBlockInner(inner);
        return render(code);
      } catch {
        return _block;
      }
    });
  }

  return out;
}

export { expandFencesInMarkdown };
