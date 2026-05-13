export function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** Halfwidth ASCII space–tilde counts as 0.5 column; other code points count as 1 (full-width column). */
export function charDisplayColumnWidth(ch) {
  return /[\u0020-\u007e]/.test(ch) ? 0.5 : 1;
}

export function stringDisplayColumnWidth(s) {
  if (!s) return 0;
  let w = 0;
  for (const ch of s) w += charDisplayColumnWidth(ch);
  return w;
}

/**
 * Wrap plain text so each line fits within `maxCols` East Asian "full-width" columns.
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

/** @typedef {{ text: string, bold?: boolean, italic?: boolean, strike?: boolean }} DescriptionStyledRun */

function mergeAdjacentRuns(runs) {
  /** @type {DescriptionStyledRun[]} */
  const out = [];
  for (const r of runs) {
    if (!r.text) continue;
    const last = out[out.length - 1];
    if (
      last &&
      !!last.bold === !!r.bold &&
      !!last.italic === !!r.italic &&
      !!last.strike === !!r.strike
    ) {
      last.text += r.text;
    } else {
      out.push({ text: r.text, bold: r.bold, italic: r.italic, strike: r.strike });
    }
  }
  return out;
}

/**
 * Parses description inline markup. Escaped `\\` drops the backslash and the next character is literal.
 * Supports `***` bold+italic, `**` bold, `*` italic, `~~` strikethrough (toggle semantics).
 */
export function parseDescriptionInline(str) {
  let bold = false;
  let italic = false;
  let strike = false;
  let buf = "";
  /** @type {DescriptionStyledRun[]} */
  const runs = [];
  function flush() {
    if (buf) {
      runs.push({
        text: buf,
        bold: bold || undefined,
        italic: italic || undefined,
        strike: strike || undefined,
      });
      buf = "";
    }
  }
  let i = 0;
  while (i < str.length) {
    const c = str[i];
    if (c === "\\") {
      if (i + 1 < str.length) {
        buf += str[i + 1];
        i += 2;
        continue;
      }
      buf += c;
      i += 1;
      continue;
    }
    if (str.slice(i, i + 3) === "***") {
      flush();
      bold = !bold;
      italic = !italic;
      i += 3;
      continue;
    }
    if (str.slice(i, i + 2) === "**") {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (c === "*") {
      flush();
      italic = !italic;
      i += 1;
      continue;
    }
    if (str.slice(i, i + 2) === "~~") {
      flush();
      strike = !strike;
      i += 2;
      continue;
    }
    buf += c;
    i += 1;
  }
  flush();
  return mergeAdjacentRuns(runs);
}

function flattenRunsToChars(runs) {
  /** @type {{ ch: string, bold: boolean, italic: boolean, strike: boolean }[]} */
  const out = [];
  for (const r of runs) {
    for (const ch of r.text) {
      out.push({
        ch,
        bold: !!r.bold,
        italic: !!r.italic,
        strike: !!r.strike,
      });
    }
  }
  return out;
}

function mergeCharLineToRuns(chars) {
  if (chars.length === 0) {
    return [{ text: "\u00a0", bold: false, italic: false, strike: false }];
  }
  /** @type {DescriptionStyledRun[]} */
  const runs = [];
  let cur = {
    text: chars[0].ch,
    bold: chars[0].bold,
    italic: chars[0].italic,
    strike: chars[0].strike,
  };
  for (let k = 1; k < chars.length; k++) {
    const c = chars[k];
    if (
      c.bold === cur.bold &&
      c.italic === cur.italic &&
      c.strike === cur.strike
    ) {
      cur.text += c.ch;
    } else {
      runs.push({
        text: cur.text,
        bold: cur.bold || undefined,
        italic: cur.italic || undefined,
        strike: cur.strike || undefined,
      });
      cur = {
        text: c.ch,
        bold: c.bold,
        italic: c.italic,
        strike: c.strike,
      };
    }
  }
  runs.push({
    text: cur.text,
    bold: cur.bold || undefined,
    italic: cur.italic || undefined,
    strike: cur.strike || undefined,
  });
  return runs;
}

function continuationIndentChars(indentCols) {
  /** @type {{ ch: string, bold: boolean, italic: boolean, strike: boolean }[]} */
  const arr = [];
  let acc = 0;
  while (acc + 0.5 <= indentCols + 1e-9) {
    arr.push({ ch: " ", bold: false, italic: false, strike: false });
    acc += 0.5;
  }
  return arr;
}

function wrapFlatCharsToVisualLines(flat, maxCols, continuationIndentCols) {
  const safeIndent = Math.min(
    continuationIndentCols,
    Math.max(0, maxCols - 0.5)
  );
  if (flat.length === 0) {
    return [[{ text: "\u00a0", bold: false, italic: false, strike: false }]];
  }
  /** @type {{ ch: string, bold: boolean, italic: boolean, strike: boolean }[][]} */
  const lines = [];
  /** @type {{ ch: string, bold: boolean, italic: boolean, strike: boolean }[]} */
  let line = [];
  let cols = 0;

  function pushLine() {
    lines.push(mergeCharLineToRuns(line));
    line = [...continuationIndentChars(safeIndent)];
    cols = safeIndent;
  }

  for (const item of flat) {
    const w = charDisplayColumnWidth(item.ch);
    if (cols + w > maxCols && line.length > 0) pushLine();
    line.push(item);
    cols += w;
  }
  if (line.length > 0) lines.push(mergeCharLineToRuns(line));
  return lines;
}

/**
 * Split a physical line into optional list prefix + remainder for inline parse.
 * `- item`, `1. item` (number + dot + space).
 */
export function splitDescriptionListLine(physicalLine) {
  const num = physicalLine.match(/^(\d+)\.\s+(.*)$/);
  if (num) {
    const prefix = `${num[1]}. `;
    return { prefix, rest: num[2] };
  }
  const bullet = physicalLine.match(/^-\s+(.*)$/);
  if (bullet) {
    return { prefix: "- ", rest: bullet[1] };
  }
  return { prefix: "", rest: physicalLine };
}

/**
 * Full description → visual lines for SVG (28 columns), with styles and list prefixes.
 * @returns {DescriptionStyledRun[][]}
 */
export function wrapDescriptionToVisualLines(description, maxCols = 28) {
  const trimmed = (description || "").trim();
  if (!trimmed) return [];
  /** @type {DescriptionStyledRun[][]} */
  const allLines = [];
  const physical = trimmed.split(/\r?\n/);
  for (let pi = 0; pi < physical.length; pi++) {
    const segment = physical[pi];
    if (segment.length === 0) {
      allLines.push([
        { text: "\u00a0", bold: false, italic: false, strike: false },
      ]);
      continue;
    }
    const { prefix, rest } = splitDescriptionListLine(segment);
    const prefixRuns = prefix
      ? [{ text: prefix, bold: false, italic: false, strike: false }]
      : [];
    const inlineRuns = parseDescriptionInline(rest);
    const combined = mergeAdjacentRuns([...prefixRuns, ...inlineRuns]);
    const flat = flattenRunsToChars(combined);
    const contIndent = stringDisplayColumnWidth(prefix);
    const visual = wrapFlatCharsToVisualLines(flat, maxCols, contIndent);
    for (const vl of visual) allLines.push(vl);
  }
  return allLines;
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
