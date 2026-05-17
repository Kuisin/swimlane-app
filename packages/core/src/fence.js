/** True when `src` already contains a full-document start marker. */
function hasFullDocumentMarker(src) {
  return /^\s*@kai-swimlane\s*$/m.test(src);
}

/**
 * Normalize ```kai-swimlane fence body for parseDSL.
 * Adds @kai-swimlane … @end when the fence omits document markers.
 */
export function normalizeFullFenceDSL(code) {
  const trimmed = String(code ?? "").replace(/\n$/, "");
  if (!trimmed) {
    return "@kai-swimlane\n/title/\n\n/line/\n@end\n";
  }
  if (hasFullDocumentMarker(trimmed)) {
    return trimmed;
  }
  return `@kai-swimlane\n${trimmed}\n@end\n`;
}

/**
 * Normalize ```kai-swimlane-parts fence body (trim only; parseDSLParts wraps internally).
 */
export function normalizePartsFenceDSL(code) {
  return String(code ?? "").replace(/\n$/, "").trim();
}
