import { BRANCH_COLOR_STYLES } from "@kai-swimlane/core";

/** Move branchStart.firstCase into a following branchCase row (GUI list shape). */
export function normalizeBranchRows(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind === "branchStart" && (row.firstCase || "").trim()) {
      const firstCase = row.firstCase.trim();
      const next = rows[i + 1];
      const alreadySplit =
        next?.kind === "branchCase" &&
        next.id === row.id &&
        (next.label || "").trim() === firstCase;
      out.push({ ...row, firstCase: "" });
      if (!alreadySplit) {
        out.push({
          kind: "branchCase",
          label: firstCase,
          branchColor: row.branchColor ?? null,
          id: row.id,
          depth: row.depth ?? 0,
        });
      }
      continue;
    }
    out.push(row);
  }
  return normalizeBranchDepths(out);
}

/** if/endif depth at index; nested if is one indent inside parent case body. */
export function branchMarkerDepthForRow(rows, rowIndex) {
  const anchor = Math.max(0, rowIndex - 1);
  const enclosing = findEnclosingBranchStart(rows, anchor);
  if (enclosing < 0) return 0;
  return (rows[enclosing].depth ?? 0) + 1;
}

/** if/elseif/endif share marker depth; case body is one indent deeper. */
export function normalizeBranchDepths(rows) {
  const out = rows.map((row) => ({ ...row }));
  for (let i = 0; i < out.length; i++) {
    if (out[i].kind !== "branchStart") continue;
    const markerDepth = branchMarkerDepthForRow(out, i);
    const branchId = out[i].id;
    const endIdx = findBranchEndIndex(out, i);
    if (endIdx < 0) continue;

    out[i] = { ...out[i], depth: markerDepth };
    if (out[endIdx].kind === "branchEnd" && out[endIdx].id === branchId) {
      out[endIdx] = { ...out[endIdx], depth: markerDepth };
    }

    const caseDepth = markerDepth;
    const bodyDepth = markerDepth + 1;
    for (let j = i + 1; j < endIdx; j++) {
      const row = out[j];
      if (row.kind === "branchStart" || row.kind === "branchEnd") continue;
      if (row.kind === "branchCase" && row.id === branchId) {
        if ((row.depth ?? 0) !== caseDepth) {
          out[j] = { ...row, depth: caseDepth };
        }
      } else if (
        (row.kind === "step" || row.kind === "branchLoop") &&
        (row.depth ?? 0) < bodyDepth
      ) {
        out[j] = { ...row, depth: bodyDepth };
      }
    }
  }
  return out;
}

export function nextBranchId(rows) {
  let max = 0;
  for (const row of rows) {
    if (row.kind === "branchStart" && typeof row.id === "number" && row.id > max) {
      max = row.id;
    }
  }
  return max + 1;
}

/** Find paired branchEnd index for branchStart at startIndex. */
export function findBranchEndIndex(rows, startIndex) {
  const start = rows[startIndex];
  if (!start || start.kind !== "branchStart") return -1;
  let depth = 0;
  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind === "branchStart") depth += 1;
    if (row.kind === "branchEnd") {
      depth -= 1;
      if (depth === 0 && row.id === start.id) return i;
    }
  }
  return -1;
}

/** Innermost branchStart index whose frame contains rowIndex, or -1. */
export function findEnclosingBranchStart(rows, rowIndex) {
  let best = -1;
  for (let i = 0; i <= rowIndex; i++) {
    if (rows[i].kind !== "branchStart") continue;
    const endIdx = findBranchEndIndex(rows, i);
    if (endIdx >= rowIndex) best = i;
  }
  return best;
}

/** Depth for branchStart / branchEnd at insertIndex (nested if increments). */
export function branchMarkerDepthAt(rows, insertIndex) {
  return branchMarkerDepthForRow(rows, insertIndex);
}

/** Depth for branchCase rows (same level as if/endif for that branch). */
export function branchCaseDepthAt(rows, insertIndex) {
  const anchor = Math.max(0, insertIndex - 1);
  const enclosing = findEnclosingBranchStart(rows, anchor);
  if (enclosing < 0) return 0;
  return rows[enclosing].depth ?? 0;
}

/** Depth for steps and loops inside a branch frame (one indent below markers). */
export function branchBodyDepthAt(rows, insertIndex) {
  const anchor = Math.max(0, insertIndex - 1);
  const enclosing = findEnclosingBranchStart(rows, anchor);
  if (enclosing < 0) return 0;
  return (rows[enclosing].depth ?? 0) + 1;
}

/** Inclusive frame bounds for step reorder (between branch markers). */
export function getStepReorderFrame(rows, rowIndex) {
  const branchStart = findEnclosingBranchStart(rows, rowIndex);
  const frameStart = branchStart >= 0 ? branchStart : 0;
  const frameEnd =
    branchStart >= 0
      ? findBranchEndIndex(rows, branchStart)
      : rows.length - 1;
  return {
    frameStart,
    frameEnd: frameEnd >= 0 ? frameEnd : rows.length - 1,
  };
}

export function isInsideOpenBranch(rows, rowIndex) {
  return findEnclosingBranchStart(rows, rowIndex) >= 0;
}

export function canAddElseIf(rows, rowIndex) {
  const branchStart = findEnclosingBranchStart(rows, rowIndex);
  if (branchStart < 0) return false;
  const endIdx = findBranchEndIndex(rows, branchStart);
  return endIdx > rowIndex;
}

function isElseBranchCase(row) {
  return (
    row?.kind === "branchCase" && /^else$/i.test((row.label || "").trim())
  );
}

/** Each case block: branchCase row through row before next case or branchEnd. */
export function getCaseBlockRanges(rows, branchStartIndex) {
  const start = rows[branchStartIndex];
  if (!start || start.kind !== "branchStart") return [];
  const endIdx = findBranchEndIndex(rows, branchStartIndex);
  if (endIdx < 0) return [];

  const branchId = start.id;
  const caseStarts = [];
  for (let i = branchStartIndex + 1; i < endIdx; i++) {
    if (rows[i].kind === "branchCase" && rows[i].id === branchId) {
      caseStarts.push(i);
    }
  }

  return caseStarts.map((caseStart, k) => ({
    caseStart,
    caseEnd:
      k + 1 < caseStarts.length ? caseStarts[k + 1] - 1 : endIdx - 1,
    isElse: isElseBranchCase(rows[caseStart]),
  }));
}

function getBranchCaseReorderBounds(rows, rowIndex) {
  const row = rows[rowIndex];
  if (row?.kind !== "branchCase" || isElseBranchCase(row)) {
    return { canUp: false, canDown: false };
  }

  const branchStart = findEnclosingBranchStart(rows, rowIndex);
  if (branchStart < 0) return { canUp: false, canDown: false };

  const ranges = getCaseBlockRanges(rows, branchStart);
  const caseIndex = ranges.findIndex((r) => r.caseStart === rowIndex);
  if (caseIndex < 0) return { canUp: false, canDown: false };

  const movable = ranges
    .map((r, i) => (r.isElse ? -1 : i))
    .filter((i) => i >= 0);
  const pos = movable.indexOf(caseIndex);

  return {
    canUp: pos > 0,
    canDown: pos >= 0 && pos < movable.length - 1,
  };
}

function getStepReorderBounds(rows, rowIndex) {
  const { frameStart, frameEnd } = getStepReorderFrame(rows, rowIndex);
  let firstStep = -1;
  let lastStep = -1;
  for (let i = frameStart; i <= frameEnd; i++) {
    if (rows[i].kind === "step" && !rows[i].empty && rows[i].role) {
      if (firstStep < 0) firstStep = i;
      lastStep = i;
    }
  }
  return {
    canUp: firstStep >= 0 && rowIndex > firstStep,
    canDown: lastStep >= 0 && rowIndex < lastStep,
  };
}

/** Case body (or root list) where a whole if block may move among steps / nested ifs. */
function getBranchReorderFrame(rows, branchStartIndex) {
  const parentStart = findEnclosingBranchStart(rows, branchStartIndex - 1);
  if (parentStart < 0) {
    return { frameStart: 0, frameEnd: rows.length - 1 };
  }
  const ranges = getCaseBlockRanges(rows, parentStart);
  for (const r of ranges) {
    if (branchStartIndex >= r.caseStart && branchStartIndex <= r.caseEnd) {
      return { frameStart: r.caseStart + 1, frameEnd: r.caseEnd };
    }
  }
  const parentEnd = findBranchEndIndex(rows, parentStart);
  return {
    frameStart: parentStart + 1,
    frameEnd: parentEnd >= 0 ? parentEnd - 1 : rows.length - 1,
  };
}

/** Top-level movable units inside a branch reorder frame. */
function collectFrameUnits(rows, frameStart, frameEnd) {
  const units = [];
  let i = frameStart;
  while (i <= frameEnd) {
    const row = rows[i];
    if (row?.kind === "branchStart") {
      const end = findBranchEndIndex(rows, i);
      if (end < 0) break;
      units.push({ kind: "branch", start: i, end });
      i = end + 1;
      continue;
    }
    if (isReorderableStep(row)) {
      units.push({ kind: "step", start: i, end: i });
    }
    i += 1;
  }
  return units;
}

function getBranchBlockReorderBounds(rows, branchStartIndex) {
  const row = rows[branchStartIndex];
  if (row?.kind !== "branchStart") {
    return { canUp: false, canDown: false };
  }
  const { frameStart, frameEnd } = getBranchReorderFrame(rows, branchStartIndex);
  const units = collectFrameUnits(rows, frameStart, frameEnd);
  const pos = units.findIndex((u) => u.kind === "branch" && u.start === branchStartIndex);
  if (pos < 0) return { canUp: false, canDown: false };
  return {
    canUp: pos > 0,
    canDown: pos >= 0 && pos < units.length - 1,
  };
}

export function canOutdentBranch(rows, branchStartIndex) {
  const row = rows[branchStartIndex];
  if (row?.kind !== "branchStart") return false;
  return findEnclosingBranchStart(rows, branchStartIndex - 1) >= 0;
}

/** Move nested if block to after its parent endif (one nesting level up). */
export function moveBranchOutOfNest(rows, branchStartIndex) {
  const row = rows[branchStartIndex];
  if (row?.kind !== "branchStart") return rows;

  const parentStart = findEnclosingBranchStart(rows, branchStartIndex - 1);
  if (parentStart < 0) return rows;

  const endIdx = findBranchEndIndex(rows, branchStartIndex);
  if (endIdx < 0) return rows;

  const block = rows.slice(branchStartIndex, endIdx + 1);
  const without = [
    ...rows.slice(0, branchStartIndex),
    ...rows.slice(endIdx + 1),
  ];

  const parentEnd = findBranchEndIndex(without, parentStart);
  if (parentEnd < 0) return rows;

  const insertAt = parentEnd + 1;
  return [
    ...without.slice(0, insertAt),
    ...block,
    ...without.slice(insertAt),
  ];
}

function frameUnitRange(rows, startIndex) {
  const row = rows[startIndex];
  if (row?.kind === "branchStart") {
    const end = findBranchEndIndex(rows, startIndex);
    if (end < 0) return null;
    return { start: startIndex, end };
  }
  if (isReorderableStep(row)) {
    return { start: startIndex, end: startIndex };
  }
  return null;
}

/** Swap a whole if block with an adjacent step or another if block. */
export function swapFrameUnits(rows, startA, startB) {
  const unitA = frameUnitRange(rows, startA);
  const unitB = frameUnitRange(rows, startB);
  if (!unitA || !unitB) return rows;

  const sliceA = rows.slice(unitA.start, unitA.end + 1);
  const sliceB = rows.slice(unitB.start, unitB.end + 1);

  if (unitA.start < unitB.start) {
    return [
      ...rows.slice(0, unitA.start),
      ...sliceB,
      ...sliceA,
      ...rows.slice(unitB.end + 1),
    ];
  }

  return [
    ...rows.slice(0, unitB.start),
    ...sliceA,
    ...sliceB,
    ...rows.slice(unitA.end + 1),
  ];
}

/** Nearest step or whole-if block above/below in the same case (or root list). */
export function findAdjacentBranchBlockIndex(rows, branchStartIndex, direction) {
  const row = rows[branchStartIndex];
  if (row?.kind !== "branchStart") return -1;

  const { frameStart, frameEnd } = getBranchReorderFrame(rows, branchStartIndex);
  const units = collectFrameUnits(rows, frameStart, frameEnd);
  const pos = units.findIndex((u) => u.kind === "branch" && u.start === branchStartIndex);
  if (pos < 0) return -1;

  if (direction === "up") {
    if (pos <= 0) return -1;
    return units[pos - 1].start;
  }

  if (pos >= units.length - 1) return -1;
  return units[pos + 1].start;
}

export function getReorderBounds(rows, rowIndex) {
  const row = rows[rowIndex];
  if (row?.kind === "branchCase") {
    return getBranchCaseReorderBounds(rows, rowIndex);
  }
  if (row?.kind === "branchStart") {
    return getBranchBlockReorderBounds(rows, rowIndex);
  }
  if (!row || row.kind !== "step" || row.empty) {
    return { canUp: false, canDown: false };
  }
  return getStepReorderBounds(rows, rowIndex);
}

export function swapStepRows(rows, indexA, indexB) {
  const next = [...rows];
  const tmp = next[indexA];
  next[indexA] = next[indexB];
  next[indexB] = tmp;
  return next;
}

function isReorderableStep(row) {
  return row?.kind === "step" && !row.empty && row.role;
}

/** Swap two adjacent case blocks (branchCase + following rows) within one if. */
export function swapCaseBlocks(rows, caseStartA, caseStartB) {
  const branchStart = findEnclosingBranchStart(rows, caseStartA);
  if (branchStart < 0 || findEnclosingBranchStart(rows, caseStartB) !== branchStart) {
    return rows;
  }

  const ranges = getCaseBlockRanges(rows, branchStart);
  const blockA = ranges.find((r) => r.caseStart === caseStartA);
  const blockB = ranges.find((r) => r.caseStart === caseStartB);
  if (!blockA || !blockB) return rows;

  const sliceA = rows.slice(blockA.caseStart, blockA.caseEnd + 1);
  const sliceB = rows.slice(blockB.caseStart, blockB.caseEnd + 1);

  if (blockA.caseStart < blockB.caseStart) {
    return [
      ...rows.slice(0, blockA.caseStart),
      ...sliceB,
      ...sliceA,
      ...rows.slice(blockB.caseEnd + 1),
    ];
  }

  return [
    ...rows.slice(0, blockB.caseStart),
    ...sliceA,
    ...sliceB,
    ...rows.slice(blockA.caseEnd + 1),
  ];
}

/** Nearest movable branchCase above/below (else stays last; moves whole case block). */
export function findAdjacentCaseIndex(rows, rowIndex, direction) {
  const row = rows[rowIndex];
  if (row?.kind !== "branchCase" || isElseBranchCase(row)) return -1;

  const branchStart = findEnclosingBranchStart(rows, rowIndex);
  if (branchStart < 0) return -1;

  const ranges = getCaseBlockRanges(rows, branchStart);
  const caseIndex = ranges.findIndex((r) => r.caseStart === rowIndex);
  if (caseIndex < 0) return -1;

  const movable = ranges
    .map((r, i) => (r.isElse ? -1 : i))
    .filter((i) => i >= 0);
  const pos = movable.indexOf(caseIndex);

  if (direction === "up") {
    if (pos <= 0) return -1;
    return ranges[movable[pos - 1]].caseStart;
  }

  if (pos < 0 || pos >= movable.length - 1) return -1;
  return ranges[movable[pos + 1]].caseStart;
}

/** Nearest step row above/below index within the same branch frame. */
export function findAdjacentStepIndex(rows, rowIndex, direction) {
  const row = rows[rowIndex];
  if (!isReorderableStep(row)) return -1;
  const { frameStart, frameEnd } = getStepReorderFrame(rows, rowIndex);
  if (direction === "up") {
    for (let i = rowIndex - 1; i >= frameStart; i--) {
      if (isReorderableStep(rows[i])) return i;
    }
  } else {
    for (let i = rowIndex + 1; i <= frameEnd; i++) {
      if (isReorderableStep(rows[i])) return i;
    }
  }
  return -1;
}

export function rowBadge(row) {
  if (!row) return "";
  switch (row.kind) {
    case "step":
      return row.empty ? "empty" : "step";
    case "branchStart":
      return "if";
    case "branchCase":
      return /^else$/i.test((row.label || "").trim()) ? "else" : "elseif";
    case "branchEnd":
      return "endif";
    case "branchLoop":
      return "[loop]";
    default:
      return row.kind;
  }
}

function laneLabel(lanes, roleId) {
  if (!roleId) return "（役割なし）";
  const lane = (lanes || []).find((l) => l.id === roleId);
  return lane?.label || roleId;
}

/** Short type label for list badges (Japanese, non-technical). */
export function rowBadgeLabel(row) {
  if (!row) return "";
  switch (row.kind) {
    case "step":
      return row.empty ? "空行" : "手順";
    case "branchStart":
      return "分岐開始";
    case "branchCase":
      return /^else$/i.test((row.label || "").trim()) ? "else" : "分岐";
    case "branchEnd":
      return "分岐終了";
    case "branchLoop":
      return "ループ";
    default:
      return "行";
  }
}

/** Human-readable one-line summary for the flow list. */
export function rowSummaryText(row, lanes) {
  if (!row) return "";
  switch (row.kind) {
    case "step": {
      if (row.empty) return "（内容のない行）";
      const who = laneLabel(lanes, row.role);
      const title = (row.name || row.text || "").trim() || "（説明未入力）";
      return `${who}：${title}`;
    }
    case "branchStart": {
      const cond = (row.cond || "").trim() || "条件";
      return `${cond}`;
    }
    case "branchCase": {
      if (/^else$/i.test((row.label || "").trim())) {
        return "上記以外の場合";
      }
      const label = (row.label || "").trim() || "ケース";
      return `${label}`;
    }
    case "branchEnd":
      return "条件分岐の終わり";
    case "branchLoop":
      return "分岐内の繰り返し";
    default:
      return "";
  }
}


export function rowKindBadgeClass(row) {
  switch (row.kind) {
    case "step":
      return "bg-stone-600";
    case "branchStart":
    case "branchEnd":
      return "bg-green-700";
    case "branchCase":
      return row.branchColor ? "" : "bg-amber-800";
    case "branchLoop":
      return "bg-stone-600";
    default:
      return "bg-stone-600";
  }
}

/** Matches diagram case chips; uses row.branchColor key (blue, green, …). */
export function branchCaseBadgeStyle(row) {
  if (row.kind !== "branchCase" || !row.branchColor) return undefined;
  const palette = BRANCH_COLOR_STYLES[row.branchColor];
  if (!palette) return undefined;
  return { backgroundColor: palette.stroke };
}