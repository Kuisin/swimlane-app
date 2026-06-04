import {
  BRANCH_COLOR_STYLES,
  branchNestLevel,
  findBranchEndIndex,
  findEnclosingBranchStart,
  findGroupEndIndex,
} from "@kai-swimlane/core";

export { findBranchEndIndex, findEnclosingBranchStart, branchNestLevel, findGroupEndIndex };

/** Move branchStart.firstCase into a following branchCase row (GUI list shape). */
export function normalizeBranchRows(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (
      row.kind === "branchStart" &&
      !row.parallel &&
      (row.firstCase || "").trim()
    ) {
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
          depth: (row.depth ?? 0) + 1,
        });
      }
      continue;
    }
    out.push(row);
  }
  return normalizeBranchDepths(out);
}

/** DSL/stored depth for if/endif: 0 at root, +1 per nesting level. */
export function branchMarkerDepthForRow(rows, rowIndex) {
  const anchor = Math.max(0, rowIndex - 1);
  const parent = findEnclosingBranchStart(rows, anchor);
  if (parent < 0) return 0;
  return branchNestLevel(rows, parent) + 1;
}

/** if/endif at marker depth; cases one below; case body one below cases (DSL export depth). */
export function normalizeBranchDepths(rows) {
  const out = rows.map((row) => ({ ...row }));
  for (let i = 0; i < out.length; i++) {
    if (out[i].kind !== "branchStart") continue;
    const markerDepth = branchMarkerDepthForRow(out, i);
    const branchId = out[i].id;
    const endIdx = findBranchEndIndex(out, i);
    if (endIdx < 0) continue;

    const isParallel = Boolean(out[i].parallel);
    out[i] = { ...out[i], depth: markerDepth };
    if (out[endIdx].kind === "branchEnd" && out[endIdx].id === branchId) {
      out[endIdx] = { ...out[endIdx], depth: markerDepth, parallel: isParallel };
    }

    const caseDepth = markerDepth + 1;
    const bodyDepth = markerDepth + 1;
    for (let j = i + 1; j < endIdx; j++) {
      const row = out[j];
      if (row.kind === "branchStart" || row.kind === "branchEnd") continue;
      if (row.kind === "branchCase" && row.id === branchId) {
        out[j] = { ...row, depth: caseDepth, parallel: isParallel };
      } else if (
        (row.kind === "step" ||
          row.kind === "branchLoop" ||
          row.kind === "branchMerge") &&
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

export function nextGroupId(rows) {
  let max = 0;
  for (const row of rows) {
    if (row.kind === "groupStart" && typeof row.id === "number" && row.id > max) {
      max = row.id;
    }
  }
  return max + 1;
}

function findEnclosingGroupStartForGui(rows, rowIndex) {
  let best = -1;
  for (let i = 0; i <= rowIndex; i++) {
    if (rows[i].kind !== "groupStart") continue;
    const endIdx = findGroupEndIndex(rows, i);
    if (endIdx < 0 || rowIndex >= endIdx) continue;
    best = i;
  }
  return best;
}

export function groupMarkerDepthAt(rows, insertIndex) {
  const anchor = Math.max(0, insertIndex - 1);
  const enclosingGroup = findEnclosingGroupStartForGui(rows, anchor);
  if (enclosingGroup >= 0) {
    return (rows[enclosingGroup].depth ?? 0) + 1;
  }
  const enclosingBranch = findEnclosingBranchStart(rows, anchor);
  if (enclosingBranch >= 0) {
    return branchBodyDepthAt(rows, insertIndex);
  }
  return 0;
}

/** Depth for branchStart / branchEnd at insertIndex (nested if increments). */
export function branchMarkerDepthAt(rows, insertIndex) {
  return branchMarkerDepthForRow(rows, insertIndex);
}

/** Depth for branchCase rows (one indent below if/endif for that branch). */
export function branchCaseDepthAt(rows, insertIndex) {
  const anchor = Math.max(0, insertIndex - 1);
  const enclosing = findEnclosingBranchStart(rows, anchor);
  if (enclosing < 0) return 1;
  return (rows[enclosing].depth ?? 0) + 1;
}

function findBranchStartForId(rows, rowIndex) {
  const row = rows[rowIndex];
  if (!row?.id) return -1;
  if (row.kind === "branchStart") return rowIndex;
  for (let j = rowIndex; j >= 0; j--) {
    if (rows[j].kind === "branchStart" && rows[j].id === row.id) return j;
  }
  return -1;
}

/**
 * GUI step list indent from branch nesting (not DSL export depth):
 * if/endif at 2n, cases at 2n+1, case body at 2n+2.
 */
export function rowListIndentDepth(rows, rowIndex) {
  const row = rows[rowIndex];
  if (row.kind === "branchStart") {
    return branchNestLevel(rows, rowIndex) * 2;
  }
  if (row.kind === "branchEnd") {
    const startIdx = findBranchStartForId(rows, rowIndex);
    if (startIdx < 0) return row.depth ?? 0;
    return branchNestLevel(rows, startIdx) * 2;
  }
  if (row.kind === "branchCase") {
    const startIdx = findBranchStartForId(rows, rowIndex);
    if (startIdx < 0) return row.depth ?? 0;
    return branchNestLevel(rows, startIdx) * 2 + 1;
  }
  if (
    row.kind === "step" ||
    row.kind === "branchLoop" ||
    row.kind === "branchMerge" ||
    row.kind === "groupStart" ||
    row.kind === "groupEnd"
  ) {
    const enclosing = findEnclosingBranchStart(rows, rowIndex);
    if (enclosing < 0) return row.depth ?? 0;
    return branchNestLevel(rows, enclosing) * 2 + 2;
  }
  return row.depth ?? 0;
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

/** The branchStart row enclosing rowIndex, or null. */
export function enclosingBranchStartRow(rows, rowIndex) {
  const idx = findEnclosingBranchStart(rows, rowIndex);
  return idx >= 0 ? rows[idx] : null;
}

export function isInsideOpenIf(rows, rowIndex) {
  const start = enclosingBranchStartRow(rows, rowIndex);
  return Boolean(start) && !start.parallel;
}

export function isInsideOpenFork(rows, rowIndex) {
  const start = enclosingBranchStartRow(rows, rowIndex);
  return Boolean(start) && Boolean(start.parallel);
}

export function canAddElseIf(rows, rowIndex) {
  const branchStart = findEnclosingBranchStart(rows, rowIndex);
  if (branchStart < 0) return false;
  if (rows[branchStart].parallel) return false;
  const endIdx = findBranchEndIndex(rows, branchStart);
  return endIdx > rowIndex;
}

/** Like canAddElseIf but for adding an `and` path inside a fork. */
export function canAddAnd(rows, rowIndex) {
  const branchStart = findEnclosingBranchStart(rows, rowIndex);
  if (branchStart < 0) return false;
  if (!rows[branchStart].parallel) return false;
  const endIdx = findBranchEndIndex(rows, branchStart);
  return endIdx > rowIndex;
}

/** Step `id:` values declared in the flow (for merge targets). */
export function collectStepMergeIds(rows) {
  const ids = [];
  for (const row of rows) {
    if (row.kind === "step" && !row.empty && row.role && (row.mergeId || "").trim()) {
      ids.push(row.mergeId.trim());
    }
  }
  return ids;
}

function collectUsedMergeIds(rows) {
  const used = new Set(collectStepMergeIds(rows));
  for (const row of rows) {
    if (row.kind === "branchMerge") {
      const target = (row.mergeTarget || "").trim();
      if (target) used.add(target);
    }
  }
  return used;
}

/** Display name for a step row (label, then body text). */
export function stepBlockDisplayName(row, rowIndex = 0) {
  const name = (row.name || "").trim();
  const text = (row.text || "").trim();
  return name || text || `手順 ${rowIndex + 1}`;
}

/** Steps that can be selected as merge targets in the GUI. */
export function collectMergeTargetOptions(rows) {
  const options = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind !== "step" || row.empty || !row.role) continue;
    const mergeId = (row.mergeId || "").trim();
    const blockName = stepBlockDisplayName(row, i);
    options.push({
      stepIndex: i,
      mergeId,
      blockName,
      label: mergeId ? `${blockName} (id: ${mergeId})` : blockName,
    });
  }
  return options;
}

/**
 * When the user selects branchEnd, edit the paired branchStart in the inspector.
 */
export function resolveInspectorTarget(rows, rowIndex) {
  const row = rows?.[rowIndex];
  if (!row) {
    return {
      inspectorRow: null,
      saveRowIndex: -1,
      isBranchRow: false,
      viaBranchEnd: false,
    };
  }

  // Selecting a closing marker edits the paired opener in the inspector.
  if (row.kind === "branchEnd" || row.kind === "groupEnd") {
    const openKind = row.kind === "branchEnd" ? "branchStart" : "groupStart";
    const startIndex = rows.findIndex(
      (r) => r.kind === openKind && r.id === row.id,
    );
    if (startIndex >= 0) {
      return {
        inspectorRow: rows[startIndex],
        saveRowIndex: startIndex,
        isBranchRow: true,
        viaBranchEnd: true,
      };
    }
  }

  const isBranchRow = [
    "branchStart",
    "branchCase",
    "branchLoop",
    "branchMerge",
    "groupStart",
  ].includes(row.kind);

  return {
    inspectorRow: row,
    saveRowIndex: rowIndex,
    isBranchRow,
    viaBranchEnd: false,
  };
}

export function mergeIdIsTaken(rows, mergeId, exceptStepIndex = -1) {
  const id = (mergeId || "").trim();
  if (!id) return false;
  for (let i = 0; i < rows.length; i++) {
    if (i === exceptStepIndex) continue;
    const row = rows[i];
    if (
      row.kind === "step" &&
      !row.empty &&
      row.role &&
      (row.mergeId || "").trim() === id
    ) {
      return true;
    }
  }
  return false;
}

/** Generate a unique merge id: a, b, … z, then aa, ab, … */
export function nextStepMergeId(rows) {
  const used = collectUsedMergeIds(rows);
  for (let i = 0; i < 26; i++) {
    const c = String.fromCharCode(97 + i);
    if (!used.has(c)) return c;
  }
  for (let a = 0; a < 26; a++) {
    for (let b = 0; b < 26; b++) {
      const c =
        String.fromCharCode(97 + a) + String.fromCharCode(97 + b);
      if (!used.has(c)) return c;
    }
  }
  return `z${rows.length + 1}`;
}

export function canAddMerge(rows, rowIndex) {
  if (!isInsideOpenIf(rows, rowIndex)) return false;
  const branchStart = findEnclosingBranchStart(rows, rowIndex);
  if (branchStart < 0) return false;
  const endIdx = findBranchEndIndex(rows, branchStart);
  if (endIdx <= rowIndex) return false;
  const branchId = rows[branchStart].id;
  for (let i = rowIndex + 1; i < endIdx; i++) {
    if (
      rows[i].kind === "branchMerge" &&
      rows[i].mergeBranchId === branchId
    ) {
      return false;
    }
  }
  return true;
}

/**
 * First step after branchEnd suitable as a merge target: existing `id:` or
 * index of a step that needs an id assigned.
 */
export function findMergeTargetAfterBranch(rows, branchStartIndex) {
  const endIdx = findBranchEndIndex(rows, branchStartIndex);
  if (endIdx < 0) return { mergeId: nextStepMergeId(rows), stepIndex: -1 };
  for (let i = endIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind === "branchStart") break;
    if (row.kind === "step" && !row.empty && row.role) {
      const existing = (row.mergeId || "").trim();
      return {
        mergeId: existing || nextStepMergeId(rows),
        stepIndex: i,
        needsId: !existing,
      };
    }
  }
  return { mergeId: nextStepMergeId(rows), stepIndex: -1, needsId: false };
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
  return normalizeBranchRows([
    ...without.slice(0, insertAt),
    ...block,
    ...without.slice(insertAt),
  ]);
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

function getMovableUnitRange(rows, index) {
  const row = rows[index];
  if (!row) return null;
  if (isReorderableStep(row)) {
    return { kind: "step", start: index, end: index };
  }
  if (row.kind === "branchCase" && !isElseBranchCase(row)) {
    const branchStart = findEnclosingBranchStart(rows, index);
    if (branchStart < 0) return null;
    const ranges = getCaseBlockRanges(rows, branchStart);
    const block = ranges.find((r) => r.caseStart === index);
    if (!block) return null;
    return { kind: "case", start: block.caseStart, end: block.caseEnd };
  }
  if (row.kind === "branchStart") {
    const endIdx = findBranchEndIndex(rows, index);
    if (endIdx < 0) return null;
    return { kind: "branch", start: index, end: endIdx };
  }
  return null;
}

function isNoOpInsert(unit, insertBefore) {
  return insertBefore === unit.start || insertBefore === unit.end + 1;
}

function moveTargetLabel(rows, insertBefore, lanes) {
  const row = rows[insertBefore];
  if (!row) return "先頭";
  return `${rowSummaryText(row, lanes)} の前`;
}

/** Valid insertion points for moving a step, case block, or whole if block. */
export function getMoveToTargets(rows, fromIndex, lanes) {
  const unit = getMovableUnitRange(rows, fromIndex);
  if (!unit) return [];
  const options = [];

  if (unit.kind === "step") {
    const { frameStart, frameEnd } = getStepReorderFrame(rows, fromIndex);
    const stepIndices = [];
    for (let i = frameStart; i <= frameEnd; i++) {
      if (isReorderableStep(rows[i])) stepIndices.push(i);
    }
    for (const idx of stepIndices) {
      if (!isNoOpInsert(unit, idx)) {
        options.push({
          insertBefore: idx,
          label: moveTargetLabel(rows, idx, lanes),
        });
      }
    }
    if (stepIndices.length > 0) {
      const endInsert = stepIndices[stepIndices.length - 1] + 1;
      if (!isNoOpInsert(unit, endInsert)) {
        options.push({
          insertBefore: endInsert,
          label: "この分岐内の末尾",
        });
      }
    }
    return options;
  }

  if (unit.kind === "case") {
    const branchStart = findEnclosingBranchStart(rows, fromIndex);
    const ranges = getCaseBlockRanges(rows, branchStart);
    for (const r of ranges) {
      if (r.caseStart === unit.start) continue;
      if (!isNoOpInsert(unit, r.caseStart)) {
        options.push({
          insertBefore: r.caseStart,
          label: moveTargetLabel(rows, r.caseStart, lanes),
        });
      }
    }
    return options;
  }

  const { frameStart, frameEnd } = getBranchReorderFrame(rows, fromIndex);
  const units = collectFrameUnits(rows, frameStart, frameEnd);
  for (const u of units) {
    if (u.kind === "branch" && u.start === unit.start) continue;
    if (!isNoOpInsert(unit, u.start)) {
      options.push({
        insertBefore: u.start,
        label: moveTargetLabel(rows, u.start, lanes),
      });
    }
  }
  if (units.length > 0) {
    const last = units[units.length - 1];
    const endInsert = last.end + 1;
    if (!isNoOpInsert(unit, endInsert)) {
      options.push({
        insertBefore: endInsert,
        label: "この範囲の末尾",
      });
    }
  }
  return options;
}

/** Move a step, case block, or whole if block to insertBefore (splice, not swap). */
export function moveUnitToInsertBefore(rows, fromIndex, insertBefore) {
  const unit = getMovableUnitRange(rows, fromIndex);
  if (!unit || isNoOpInsert(unit, insertBefore)) return rows;
  const slice = rows.slice(unit.start, unit.end + 1);
  const without = [
    ...rows.slice(0, unit.start),
    ...rows.slice(unit.end + 1),
  ];
  const adjusted =
    insertBefore > unit.start
      ? insertBefore - (unit.end - unit.start + 1)
      : insertBefore;
  return normalizeBranchRows([
    ...without.slice(0, adjusted),
    ...slice,
    ...without.slice(adjusted),
  ]);
}

/** Row index after moveUnitToInsertBefore (for selection highlight). */
export function resolveMovedIndex(rows, fromIndex, insertBefore) {
  const unit = getMovableUnitRange(rows, fromIndex);
  if (!unit) return fromIndex;
  if (insertBefore > unit.start) {
    return insertBefore - (unit.end - unit.start + 1);
  }
  return insertBefore;
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
      return row.parallel ? "fork" : "if";
    case "branchCase":
      if (row.parallel) return "and";
      return /^else$/i.test((row.label || "").trim()) ? "else" : "elseif";
    case "branchEnd":
      return row.parallel ? "endfork" : "endif";
    case "branchLoop":
      return "[loop]";
    case "branchMerge":
      return "merge";
    case "groupStart":
      return (row.groupMode ?? "branch") === "branch" ? "branch" : "section";
    case "groupEnd":
      return (row.groupMode ?? "branch") === "branch"
        ? "end-branch"
        : "end-section";
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
      return row.parallel ? "並行開始" : "分岐開始";
    case "branchCase":
      if (row.parallel) return "並行";
      return /^else$/i.test((row.label || "").trim()) ? "else" : "分岐";
    case "branchEnd":
      return row.parallel ? "並行終了" : "分岐終了";
    case "branchLoop":
      return "ループ";
    case "branchMerge":
      return "合流";
    case "groupStart":
      return (row.groupMode ?? "branch") === "branch" ? "支線開始" : "枠開始";
    case "groupEnd":
      return (row.groupMode ?? "branch") === "branch" ? "支線終了" : "枠終了";
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
      const idPart = (row.mergeId || "").trim()
        ? `id=${row.mergeId} · `
        : "";
      const arrowPart =
        row.arrowLine && row.arrowLine !== "solid"
          ? `arrow=${row.arrowLine} · `
          : "";
      return `${idPart}${arrowPart}${who}：${title}`;
    }
    case "branchStart": {
      if (row.parallel) return "並行処理（同時に実行）";
      const cond = (row.cond || "").trim() || "条件";
      return `${cond}`;
    }
    case "branchCase": {
      if (row.parallel) return "並行パス";
      if (/^else$/i.test((row.label || "").trim())) {
        return "上記以外の場合";
      }
      const label = (row.label || "").trim() || "ケース";
      return `${label}`;
    }
    case "branchEnd":
      return row.parallel ? "並行処理の終わり" : "条件分岐の終わり";
    case "branchLoop":
      return "分岐内の繰り返し";
    case "branchMerge":
      return `合流先 id：${(row.mergeTarget || "").trim() || "（未設定）"}`;
    case "groupStart":
      return (row.groupMode ?? "branch") === "branch"
        ? "支線（本流から分岐・末尾で合流）"
        : "枠（ボックス表示のみ・本流のまま）";
    case "groupEnd":
      return (row.groupMode ?? "branch") === "branch"
        ? "支線の終わり（本流へ合流）"
        : "枠の終わり";
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
      return row.parallel ? "bg-purple-700" : "bg-green-700";
    case "branchCase":
      if (row.parallel) return "bg-purple-800";
      return row.branchColor ? "" : "bg-amber-800";
    case "branchLoop":
      return "bg-stone-600";
    case "branchMerge":
      return "bg-sky-800";
    case "groupStart":
    case "groupEnd":
      return (row.groupMode ?? "branch") === "branch"
        ? "bg-indigo-700"
        : "bg-slate-700";
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