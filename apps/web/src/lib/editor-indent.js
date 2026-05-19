const INDENT = "  ";

function getLineBlockBounds(text, selectionStart, selectionEnd) {
  const lineStart =
    selectionStart === 0 ? 0 : text.lastIndexOf("\n", selectionStart - 1) + 1;
  let lineEnd = text.indexOf("\n", selectionEnd);
  if (lineEnd === -1) lineEnd = text.length;
  return { lineStart, lineEnd };
}

/**
 * IDE-style Tab / Shift+Tab: insert or remove two spaces per line.
 * @returns {{ value: string, selectionStart: number, selectionEnd: number } | null}
 */
export function applyTabIndent(text, selectionStart, selectionEnd, shiftKey) {
  const hasSelection = selectionStart !== selectionEnd;

  if (!hasSelection) {
    if (shiftKey) {
      if (text.slice(selectionStart - 2, selectionStart) === INDENT) {
        return {
          value: text.slice(0, selectionStart - 2) + text.slice(selectionStart),
          selectionStart: selectionStart - 2,
          selectionEnd: selectionStart - 2,
        };
      }
      if (text.slice(selectionStart - 1, selectionStart) === " ") {
        return {
          value: text.slice(0, selectionStart - 1) + text.slice(selectionStart),
          selectionStart: selectionStart - 1,
          selectionEnd: selectionStart - 1,
        };
      }
      return null;
    }

    return {
      value: text.slice(0, selectionStart) + INDENT + text.slice(selectionEnd),
      selectionStart: selectionStart + INDENT.length,
      selectionEnd: selectionStart + INDENT.length,
    };
  }

  const { lineStart, lineEnd } = getLineBlockBounds(
    text,
    selectionStart,
    selectionEnd,
  );
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split("\n");

  if (shiftKey) {
    let startDelta = 0;
    let totalDelta = 0;
    const newLines = lines.map((line, index) => {
      let removed = 0;
      if (line.startsWith(INDENT)) removed = INDENT.length;
      else if (line.startsWith(" ")) removed = 1;
      if (index === 0) startDelta = -removed;
      totalDelta -= removed;
      return line.slice(removed);
    });

    return {
      value: text.slice(0, lineStart) + newLines.join("\n") + text.slice(lineEnd),
      selectionStart: selectionStart + startDelta,
      selectionEnd: selectionEnd + totalDelta,
    };
  }

  const newLines = lines.map((line) => INDENT + line);
  const lineCount = lines.length;

  return {
    value: text.slice(0, lineStart) + newLines.join("\n") + text.slice(lineEnd),
    selectionStart: selectionStart + INDENT.length,
    selectionEnd: selectionEnd + INDENT.length * lineCount,
  };
}
