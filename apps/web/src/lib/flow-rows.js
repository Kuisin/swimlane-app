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
          depth: row.depth,
        });
      }
      continue;
    }
    out.push(row);
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

export function getReorderBounds(rows, rowIndex) {
  const row = rows[rowIndex];
  if (!row || row.kind !== "step" || row.empty) {
    return { canUp: false, canDown: false };
  }
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
      return `「${cond}」`;
    }
    case "branchCase": {
      if (/^else$/i.test((row.label || "").trim())) {
        return "上記以外の場合";
      }
      const label = (row.label || "").trim() || "ケース";
      return `「${label}」の場合`;
    }
    case "branchEnd":
      return "条件分岐の終わり";
    case "branchLoop":
      return "分岐内の繰り返し";
    default:
      return "";
  }
}
