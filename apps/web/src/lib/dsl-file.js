import { triggerDownload } from "./export";

function dslFileBaseName(title) {
  const base = (title || "swimlane").trim() || "swimlane";
  // Strip OS-reserved filename chars and ASCII control range.
  // eslint-disable-next-line no-control-regex
  return base.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 120);
}

export function downloadDslTxt(src, title) {
  const blob = new Blob([src], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${dslFileBaseName(title)}.txt`);
}
