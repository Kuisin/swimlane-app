import { triggerDownload } from "./export.js";

function dslFileBaseName(title) {
  const base = (title || "swimlane").trim() || "swimlane";
  return base.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 120);
}

export function downloadDslTxt(src, title) {
  const blob = new Blob([src], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${dslFileBaseName(title)}.txt`);
}
