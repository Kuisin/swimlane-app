export function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** Halfwidth ASCII space–tilde counts as 0.5 column; other code points count as 1 (full-width column). */
function charDisplayColumnWidth(ch) {
  return /[\u0020-\u007e]/.test(ch) ? 0.5 : 1;
}

/**
 * Wrap text so each line fits within `maxCols` East Asian "full-width" columns.
 * Respects existing newlines as paragraph breaks.
 */
export function wrapTextToDisplayColumns(text, maxCols = 28) {
  if (!text) return [];
  const lines = [];
  for (const segment of text.split(/\r?\n/)) {
    let line = "";
    let cols = 0;
    for (const ch of segment) {
      const w = charDisplayColumnWidth(ch);
      if (cols + w > maxCols && line.length > 0) {
        lines.push(line);
        line = "";
        cols = 0;
      }
      line += ch;
      cols += w;
    }
    if (line.length > 0) lines.push(line);
  }
  return lines;
}

export function parseHelpMd(md) {
  const sections = [];
  for (const block of md.split(/^## /m).filter(Boolean)) {
    const lines = block.split(/\r?\n/);
    const title = lines[0].trim();
    const body = lines.slice(1).join("\n");
    const codeMatch = body.match(/```\n?([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].replace(/\n$/, "") : "";
    const desc = body.replace(/```[\s\S]*?```/, "").trim();
    sections.push({ title, code, desc });
  }
  return sections;
}
