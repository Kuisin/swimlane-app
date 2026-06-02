/** Shared section / end-section geometry (parser, diagram, GUI). */

export function findGroupEndIndex(rows, startIndex) {
  const start = rows[startIndex];
  if (!start || start.kind !== "groupStart") return -1;
  let depth = 0;
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind === "groupStart") depth += 1;
    if (row.kind === "groupEnd") {
      depth -= 1;
      if (depth === 0 && row.id === start.id) return i;
    }
  }
  return -1;
}

export function groupStartIndexForEnd(rows, rowIndex) {
  const row = rows[rowIndex];
  if (row?.kind !== "groupEnd") return -1;
  for (let j = rowIndex; j >= 0; j--) {
    if (rows[j].kind === "groupStart" && rows[j].id === row.id) return j;
  }
  return -1;
}

/** Innermost groupStart whose body strictly contains rowIndex. */
export function findEnclosingGroupStart(rows, rowIndex) {
  if (rowIndex < 0) return -1;
  let best = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].kind !== "groupStart") continue;
    const endIdx = findGroupEndIndex(rows, i);
    if (endIdx < 0 || rowIndex <= i || rowIndex >= endIdx) continue;
    best = i;
  }
  return best;
}

/** Last main-flow step immediately before a section row. */
export function findLastMainFlowStepBeforeGroupStart(rows, groupStartIndex) {
  for (let j = groupStartIndex - 1; j >= 0; j--) {
    const row = rows[j];
    if (row.kind === "step" && !row.empty && row.role && !isInsideGroup(rows, j)) {
      return j;
    }
    if (row.kind === "branchStart") break;
  }
  return -1;
}

/** True when rowIndex sits strictly inside a section … end-section span. */
export function isInsideGroup(rows, rowIndex) {
  return findEnclosingGroupStart(rows, rowIndex) >= 0;
}

/** First step after groupEnd that is not inside another group. */
export function findNextMainFlowStepAfterGroupEnd(rows, groupEndIndex) {
  for (let j = groupEndIndex + 1; j < rows.length; j++) {
    const row = rows[j];
    if (row.kind === "groupStart") break;
    if (row.kind === "branchStart") break;
    if (row.kind === "step" && !row.empty && row.role && !isInsideGroup(rows, j)) {
      return j;
    }
  }
  return -1;
}

/**
 * Next main-flow continuation after end-section: a step, or the next branch
 * gateway when the group is immediately followed by if/fork.
 */
export function findFlowContinuityAfterGroupEnd(rows, groupEndIndex) {
  const stepIdx = findNextMainFlowStepAfterGroupEnd(rows, groupEndIndex);
  if (stepIdx >= 0) return { type: "step", index: stepIdx };
  for (let j = groupEndIndex + 1; j < rows.length; j++) {
    const row = rows[j];
    if (row.kind === "branchStart") {
      return { type: "branch", index: j };
    }
    if (row.kind === "groupStart") break;
  }
  return null;
}
