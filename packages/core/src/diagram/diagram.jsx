import { truncate, wrapDescriptionToVisualLines } from "../utils.js";
import { buildStepRowDisplayInfo } from "../parser.js";
import { StepShape } from "./step-shape";
import { BlockIcon } from "./block-icon";

const BRANCH_COLOR_STYLES = {
  blue: { stroke: "#2563eb", bg: "#dbeafe" },
  green: { stroke: "#15803d", bg: "#dcfce7" },
  red: { stroke: "#b91c1c", bg: "#fee2e2" },
  orange: { stroke: "#c2410c", bg: "#ffedd5" },
  purple: { stroke: "#7e22ce", bg: "#f3e8ff" },
  gray: { stroke: "#374151", bg: "#f3f4f6" },
  black: { stroke: "#111827", bg: "#e5e7eb" },
};

export function Diagram({ model, theme, showStepBlockCaptions = true }) {
  const { title, lanes, rows, blocks = {}, props = {} } = model;
  const minLaneW = 220;
  const maxLaneW = 360;
  const nodeW = 188;
  const xPad = 40;
  const leftGutter = 300;
  const topPad = title ? 72 : 32;
  const headerH = 72;
  const rowH = 80;

  /** Vertical spacing between stacked props below the step (same value in `stepRowHeight`). */
  const docW = 65;
  const docH = 40;
  const docGapX = 8;
  const docGapY = 16;

  const propRowExtraHBase = 20;
  const propRowExtraHPerProps = docGapY;

  /** Left-gutter description: line metrics (fontSize 10). */
  const descriptionLineHeight = 14;
  const descriptionBottomPad = 10;

  const caseSpread = 100;

  const diamondH = 90;
  const mergeH = 60;
  const branchLoopH = 24;
  const decisionYOffset = -15;
  const branchCaseBendYOffset = 10;
  const stepBoxH = 44;
  const loopRouteMargin = 32;
  const loopDropPad = 14;
  /** Previous step → if: horizontal elbow closer to the diamond (below the step block), not mid-gap. */

  const rowMeta = [];
  let y = topPad + headerH + 24;
  const frames = [];
  const frameStack = [];
  const laneIndexById = new Map(lanes.map((lane, idx) => [lane.id, idx]));
  const stepRowDisplay = buildStepRowDisplayInfo(rows);
  const stepRowHeightByIndex = new Map();

  function resolveBranchStyle(colorKey) {
    const custom = colorKey ? BRANCH_COLOR_STYLES[colorKey] : null;
    if (!custom) return { stroke: theme.branch, bg: theme.branchBg };
    return custom;
  }

  function stepPropCounts(row) {
    const acc = { left: 0, right: 0 };
    (row?.props || []).forEach((propId) => {
      const side = props[propId]?.side === "left" ? "left" : "right";
      acc[side] += 1;
    });
    return acc;
  }

  /**
   * Extra height so the left-gutter description fits; compare after props have extended the row.
   * Overflow may use vertical space before the next layout row:
   * - Next row is a `skipIndex` step: subtract that step’s row height.
   * - Next row is `branchStart` (if): subtract `diamondH`, same band the decision uses.
   */
  function stepDescriptionExtraHeight(row, rowIndex, heightWithProps) {
    const desc = (row?.description || "").trim();
    if (!desc) return 0;
    const titleText = (row.name || row.text || "").trim();
    const visualLines = wrapDescriptionToVisualLines(desc, 28);
    if (visualLines.length === 0) return 0;
    const descStartOffset = titleText ? 40 : 20;
    const extent =
      descStartOffset +
      visualLines.length * descriptionLineHeight +
      descriptionBottomPad;
    let descExtra = Math.max(0, extent - heightWithProps);
    if (descExtra <= 0) return 0;

    const next = rows[rowIndex + 1];
    if (
      next?.kind === "step" &&
      !next.empty &&
      next.role &&
      next.skipIndex
    ) {
      const nextH = stepRowHeight(next, rowIndex + 1);
      descExtra = Math.max(0, descExtra - nextH);
    } else if (next?.kind === "branchStart") {
      descExtra = Math.max(0, descExtra - diamondH);
    }
    return descExtra;
  }

  function stepRowHeight(row, rowIndex) {
    if (!row || row.kind !== "step" || row.empty) return rowH;
    const counts = stepPropCounts(row);
    const maxPropsPerSide = Math.max(counts.left, counts.right);

    const propExtra =
      (maxPropsPerSide > 0 && propRowExtraHBase) +
      Math.max(0, maxPropsPerSide - 1) * propRowExtraHPerProps;
    const heightWithProps = rowH + propExtra;
    const descExtra = stepDescriptionExtraHeight(row, rowIndex, heightWithProps);

    return heightWithProps + descExtra;
  }

  function rowCenterY(rowIndex) {
    const yRow = rowMeta[rowIndex]?.y ?? 0;
    const h = stepRowHeightByIndex.get(rowIndex) || rowH;
    return yRow + h / 2;
  }

  /** Vertical center of the step block (not the full row). Extra prop height sits below the block. */
  function stepBlockCenterY(rowIndex) {
    const row = rows[rowIndex];
    if (row?.kind === "step") {
      const yRow = rowMeta[rowIndex]?.y ?? 0;
      return yRow + rowH / 2;
    }
    return rowCenterY(rowIndex);
  }

  /** Bottom edge of the step shape only (props below are excluded). */
  function stepBlockBottomY(rowIndex) {
    const row = rows[rowIndex];
    if (!row || row.kind !== "step") {
      const yRow = rowMeta[rowIndex]?.y ?? 0;
      return yRow + (stepRowHeightByIndex.get(rowIndex) || rowH);
    }
    return stepBlockCenterY(rowIndex) + stepBoxH / 2;
  }

  function estimateTextWidth(text, base = 28) {
    if (!text) return base;
    let width = base;
    for (const ch of text) width += /[ -~]/.test(ch) ? 8 : 14;
    return width;
  }

  function pushToActiveCase(rowIndex) {
    const frame = frameStack[frameStack.length - 1];
    if (!frame) return;
    const lastCase = frame.cases[frame.cases.length - 1];
    if (lastCase) lastCase.rowIndices.push(rowIndex);
  }

  rows.forEach((r, i) => {
    if (r.kind === "branchStart") {
      const f = {
        id: r.id,
        depth: r.depth,
        cond: r.cond,
        yDecision: y,
        decisionColor: r.branchColor || null,
        cases: [
          {
            label: r.firstCase,
            color: r.branchColor || null,
            rowIndices: [],
            startRow: i,
          },
        ],
        parentCase: null,
        anchorX: null,
      };
      if (frameStack.length > 0) {
        const parent = frameStack[frameStack.length - 1];
        const parentCase = parent.cases[parent.cases.length - 1];
        parentCase.childFrame = f;
        f.parentCase = parentCase;
      }
      frameStack.push(f);
      frames.push(f);
      rowMeta[i] = { y, kind: "decision" };
      y += diamondH;
    } else if (r.kind === "branchCase") {
      const f = frameStack[frameStack.length - 1];
      if (f)
        f.cases.push({
          label: r.label,
          color: r.branchColor || null,
          rowIndices: [],
          startRow: i,
        });
      rowMeta[i] = { y, kind: "case" };
    } else if (r.kind === "branchEnd") {
      const f = frameStack.pop();
      if (f) {
        f.yMerge = y;
        f.endRow = i;
      }
      rowMeta[i] = { y, kind: "merge" };
      y += mergeH;
    } else if (r.kind === "branchLoop") {
      stepRowHeightByIndex.set(i, branchLoopH);
      rowMeta[i] = { y, kind: "branchLoop" };
      pushToActiveCase(i);
      y += branchLoopH;
    } else if (r.kind === "step") {
      const h = stepRowHeight(r, i);
      stepRowHeightByIndex.set(i, h);
      rowMeta[i] = { y, kind: "step" };
      pushToActiveCase(i);
      y += h;
    }
  });

  function caseHasDirectStep(c) {
    return c.rowIndices.some((idx) => {
      const row = rows[idx];
      return row?.kind === "step" && !row.empty && row.role;
    });
  }

  function firstDirectStepIdx(c) {
    return c.rowIndices.find((idx) => {
      const row = rows[idx];
      return row?.kind === "step" && !row.empty && row.role;
    });
  }

  /** Where a case path meets the merge diamond (after nested if, if any). */
  function caseMergeAnchor(c) {
    const childFrame = c.childFrame;
    if (childFrame?.yMerge != null) {
      const childEndIdx =
        childFrame.endRow ??
        rows.findIndex(
          (r) => r.kind === "branchEnd" && r.id === childFrame.id,
        );
      const stepsAfterChild = c.rowIndices.filter((idx) => {
        const row = rows[idx];
        return (
          row?.kind === "step" &&
          !row.empty &&
          row.role &&
          (childEndIdx < 0 || idx > childEndIdx)
        );
      });
      const lastAfterChild = stepsAfterChild[stepsAfterChild.length - 1];
      if (lastAfterChild != null) {
        const r = rows[lastAfterChild];
        const li = laneIndex(r.role);
        return {
          fromX:
            li >= 0 ? nodeCenterX(lastAfterChild, r.role) : caseAnchorX(c),
          fromY: stepBlockCenterY(lastAfterChild) + 22,
        };
      }
      return {
        fromX: frameAnchorX(childFrame),
        fromY: childFrame.yMerge + mergeH / 2 - 14,
      };
    }

    const lastDirectStepIdx = [...c.rowIndices]
      .reverse()
      .find((idx) => {
        const row = rows[idx];
        return row?.kind === "step" && !row.empty && row.role;
      });
    if (lastDirectStepIdx != null) {
      const r = rows[lastDirectStepIdx];
      const li = laneIndex(r.role);
      return {
        fromX:
          li >= 0 ? nodeCenterX(lastDirectStepIdx, r.role) : caseAnchorX(c),
        fromY: stepBlockCenterY(lastDirectStepIdx) + 22,
      };
    }
    return null;
  }

  /** Lane for a case anchor (first step role, or nested child lane). */
  function resolveCaseLane(c) {
    const stepIdx = firstDirectStepIdx(c);
    if (stepIdx != null) return rows[stepIdx].role;
    if (c.childFrame) {
      for (const nc of c.childFrame.cases) {
        const lane = resolveCaseLane(nc);
        if (lane) return lane;
      }
    }
    return null;
  }

  /** True if the case has any step (including nested) in this role lane. */
  function caseTouchesLane(c, laneId) {
    for (const idx of c.rowIndices) {
      const row = rows[idx];
      if (row?.kind === "step" && !row.empty && row.role === laneId) return true;
    }
    if (c.childFrame) {
      for (const nc of c.childFrame.cases) {
        if (caseTouchesLane(nc, laneId)) return true;
      }
    }
    return false;
  }

  /** Case count per lane including all nested child if branches (for lane width). */
  function countCasesInLaneIncludingNested(frame, laneId) {
    let siblingsInLane = 0;
    let maxNested = 0;
    for (const c of frame.cases) {
      if (caseTouchesLane(c, laneId)) siblingsInLane++;
      if (c.childFrame) {
        maxNested = Math.max(
          maxNested,
          countCasesInLaneIncludingNested(c.childFrame, laneId),
        );
      }
    }
    if (siblingsInLane > 0 && maxNested > 0) {
      return siblingsInLane + maxNested - 1;
    }
    return Math.max(siblingsInLane, maxNested);
  }

  const maxCasesPerLane = new Map();
  for (const f of frames) {
    if (f.parentCase) continue;
    for (const lane of lanes) {
      const n = countCasesInLaneIncludingNested(f, lane.id);
      const prev = maxCasesPerLane.get(lane.id) || 0;
      maxCasesPerLane.set(lane.id, Math.max(prev, n));
    }
  }

  const laneWidths = lanes.map((lane) => {
    const headerWidth = estimateTextWidth(lane.label || lane.id, lane.icon ? 88 : 64);
    const maxStepWidth = rows.reduce((maxWidth, row) => {
      if (row.kind !== "step" || row.role !== lane.id || row.empty) return maxWidth;
      const stepWidth = estimateTextWidth(row.text, 68);
      return Math.max(maxWidth, stepWidth);
    }, 0);
    const caseCount = maxCasesPerLane.get(lane.id) || 0;
    const branchWidth = caseCount > 1 ? minLaneW + (caseCount - 1) * caseSpread : minLaneW;
    // Cap label/step width but never shrink below branch fan-out (else multi-case if clips nodes and elbows).
    const textPart = Math.max(minLaneW, headerWidth, maxStepWidth);
    return Math.max(Math.min(maxLaneW, textPart), branchWidth);
  });
  const laneOffsets = [];
  let laneCursor = xPad + leftGutter;
  laneWidths.forEach((w, idx) => {
    laneOffsets[idx] = laneCursor;
    laneCursor += w;
  });

  const width = laneCursor + xPad;
  const baseBottomPadding = 50;

  const laneIndex = (id) => laneIndexById.get(id) ?? -1;
  const laneX = (i) => laneOffsets[i] ?? xPad + leftGutter;
  const laneCenter = (i) => laneX(i) + (laneWidths[i] ?? minLaneW) / 2;
  const laneWidth = (i) => laneWidths[i] ?? minLaneW;

  function caseAnchorX(c) {
    return (c.x ?? width / 2) + (c.offset || 0);
  }

  function frameAnchorX(f) {
    return f.anchorX ?? f.cases[0]?.x ?? width / 2;
  }

  function laneIndexForX(x) {
    for (let li = 0; li < lanes.length; li++) {
      if (x >= laneX(li) && x <= laneX(li) + laneWidth(li)) return li;
    }
    return -1;
  }

  frames.forEach((f) => {
    f.cases.forEach((c) => {
      const firstStep = firstDirectStepIdx(c);
      if (firstStep != null) {
        const row = rows[firstStep];
        const li = laneIndex(row.role);
        c.x = li >= 0 ? laneCenter(li) : width / 2;
      } else {
        c.x = width / 2;
      }
    });
    const usedX = {};
    f.cases.forEach((c, idx) => {
      const key = Math.round(c.x);
      if (usedX[key] != null) {
        c.x = c.x + (idx - f.cases.length / 2) * 40;
      }
      usedX[key] = idx;
    });
  });

  const framesByDepthDesc = [...frames].sort(
    (a, b) => (b.depth ?? 0) - (a.depth ?? 0),
  );
  const framesByDepthAsc = [...frames].sort(
    (a, b) => (a.depth ?? 0) - (b.depth ?? 0),
  );

  for (const f of framesByDepthDesc) {
    f.anchorX = caseAnchorX(f.cases[0]);
  }
  for (const f of framesByDepthAsc) {
    for (const c of f.cases) {
      if (c.childFrame && !caseHasDirectStep(c)) {
        c.x = frameAnchorX(c.childFrame) - (c.offset || 0);
      }
    }
  }
  for (const f of framesByDepthDesc) {
    if (f.parentCase) {
      f.anchorX = caseAnchorX(f.parentCase);
    }
  }

  const stepRows = rows
    .map((r, i) => ({ r, i, y: rowMeta[i]?.y, meta: rowMeta[i] }))
    .filter((x) => x.r.kind === "step" && !x.r.empty && x.r.role);

  const connectors = [];
  const terminalGap = 28;
  const terminalRadius = 5;
  const stepOffsetByIndex = new Map();
  function caseOfStep(stepIdx) {
    let matched = null;
    for (const f of frames) {
      for (let ci = 0; ci < f.cases.length; ci++) {
        if (f.cases[ci].rowIndices.includes(stepIdx))
          matched = { frame: f, caseIdx: ci };
      }
    }
    return matched;
  }
  function loopAnchorInCase(rowIndices, branchId) {
    const loopIdx = [...rowIndices]
      .reverse()
      .find(
        (idx) =>
          rows[idx]?.kind === "branchLoop" &&
          rows[idx].loopBranchId === branchId
      );
    if (loopIdx == null) return null;
    const prevStepIdx = [...rowIndices]
      .filter((idx) => idx < loopIdx)
      .reverse()
      .find(
        (idx) =>
          rows[idx]?.kind === "step" &&
          !rows[idx].empty &&
          rows[idx].role
      );
    return { loopIdx, prevStepIdx: prevStepIdx ?? null };
  }
  function applyCaseOffsetsForFrame(frame, inheritedByLane = null) {
    const inherited =
      inheritedByLane ||
      Object.fromEntries(lanes.map((lane) => [lane.id, 0]));

    const casesByLane = new Map();
    frame.cases.forEach((c, caseIdx) => {
      for (const lane of lanes) {
        if (!caseTouchesLane(c, lane.id)) continue;
        const list = casesByLane.get(lane.id) || [];
        if (!list.includes(caseIdx)) list.push(caseIdx);
        casesByLane.set(lane.id, list);
      }
    });

    const caseLaneOffset = new Map();
    casesByLane.forEach((indices, laneId) => {
      const center = (indices.length - 1) / 2;
      indices.forEach((caseIdx, j) => {
        caseLaneOffset.set(`${caseIdx}-${laneId}`, (j - center) * caseSpread);
      });
    });

    frame.cases.forEach((c, caseIdx) => {
      const anchorLane = resolveCaseLane(c);
      c.offset =
        anchorLane != null
          ? caseLaneOffset.get(`${caseIdx}-${anchorLane}`) || 0
          : 0;

      c.rowIndices.forEach((stepIdx) => {
        const row = rows[stepIdx];
        if (row?.kind === "step" && !row.empty && row.role) {
          const laneOff = caseLaneOffset.get(`${caseIdx}-${row.role}`) || 0;
          stepOffsetByIndex.set(
            stepIdx,
            (inherited[row.role] || 0) + laneOff,
          );
        }
      });

      if (c.childFrame) {
        const childInherited = { ...inherited };
        for (const lane of lanes) {
          const laneId = lane.id;
          childInherited[laneId] =
            (childInherited[laneId] || 0) +
            (caseLaneOffset.get(`${caseIdx}-${laneId}`) || 0);
        }
        applyCaseOffsetsForFrame(c.childFrame, childInherited);
      }
    });
  }

  for (const f of frames) {
    if (!f.parentCase) applyCaseOffsetsForFrame(f, null);
  }
  function nodeCenterX(stepIdx, roleId) {
    const li = laneIndex(roleId);
    if (li < 0) return width / 2;
    const baseX = laneCenter(li);
    const offset = stepOffsetByIndex.get(stepIdx) || 0;
    return baseX + offset;
  }

  /** Block + props extent used for loop routing around obstacles. */
  function stepObstacleBounds(rowIndex) {
    const row = rows[rowIndex];
    const cx =
      row?.role && laneIndex(row.role) >= 0
        ? nodeCenterX(rowIndex, row.role)
        : width / 2;
    let left = cx - nodeW / 2;
    let right = cx + nodeW / 2;
    let top = stepBlockCenterY(rowIndex) - stepBoxH / 2;
    let bottom = stepBlockBottomY(rowIndex);

    if (!row || row.kind !== "step") {
      return { left, right, top, bottom };
    }

    const cy = stepBlockCenterY(rowIndex);
    const { left: leftProps, right: rightProps } = splitPropsBySide(row.props);
    const docY = cy + stepBoxH / 2 - 8;

    leftProps.forEach((prop, docIdx) => {
      const x = cx - nodeW / 2 + 55 - docW + docIdx * docGapX;
      left = Math.min(left, x);
      right = Math.max(right, x + docW);
      bottom = Math.max(bottom, docY + docIdx * docGapY + docH);
    });
    rightProps.forEach((prop, docIdx) => {
      const x = cx + nodeW / 2 - 60 + docIdx * docGapX;
      left = Math.min(left, x);
      right = Math.max(right, x + docW);
      bottom = Math.max(bottom, docY + docIdx * docGapY + docH);
    });

    return { left, right, top, bottom };
  }

  function collectLoopObstacles(frame, sourceStepIdx, routeBottomY) {
    const yMin = frame.yDecision;
    const yMax = routeBottomY;
    const overlaps = (top, bottom) => bottom >= yMin && top <= yMax;
    const rects = [];

    rows.forEach((row, idx) => {
      if (row?.kind !== "step" || row.empty || !row.role) return;
      const b = stepObstacleBounds(idx);
      if (overlaps(b.top, b.bottom)) rects.push(b);
    });

    return rects;
  }

  /** Route from block bottom, around obstacles, into the side of the if diamond. */
  function buildLoopBackPath({
    fromX,
    fromBottomY,
    dCx,
    dCy,
    dW,
    frame,
    sourceStepIdx,
    caseOffset,
  }) {
    const startY = fromBottomY;
    const sourceBounds =
      sourceStepIdx != null ? stepObstacleBounds(sourceStepIdx) : null;
    const dropY = (sourceBounds?.bottom ?? startY) + loopDropPad;
    const obstacles = collectLoopObstacles(frame, sourceStepIdx, dropY);

    let sideSign;
    if (caseOffset !== 0) {
      sideSign = Math.sign(caseOffset);
    } else if (obstacles.length > 0) {
      const minLeft = Math.min(...obstacles.map((o) => o.left));
      const maxRight = Math.max(...obstacles.map((o) => o.right));
      const spaceLeft = fromX - minLeft;
      const spaceRight = maxRight - fromX;
      sideSign = spaceRight >= spaceLeft ? 1 : -1;
    } else {
      sideSign = fromX <= dCx ? -1 : 1;
    }

    const extentLeft = obstacles.length
      ? Math.min(...obstacles.map((o) => o.left))
      : sourceBounds?.left ?? fromX - nodeW / 2;
    const extentRight = obstacles.length
      ? Math.max(...obstacles.map((o) => o.right))
      : sourceBounds?.right ?? fromX + nodeW / 2;

    let routeX;
    if (sideSign < 0) {
      routeX =
        Math.min(extentLeft, fromX, dCx - dW / 2) - loopRouteMargin;
    } else {
      routeX =
        Math.max(extentRight, fromX, dCx + dW / 2) + loopRouteMargin;
    }
    routeX = Math.max(xPad + 12, Math.min(width - xPad - 12, routeX));

    const enterFromLeft = routeX < dCx;
    const toX = enterFromLeft ? dCx - dW / 2 : dCx + dW / 2;
    const toY = dCy;

    if (Math.abs(fromX - routeX) < 0.5) {
      return `M ${fromX} ${startY} L ${fromX} ${dropY} L ${routeX} ${toY} L ${toX} ${toY}`;
    }
    return `M ${fromX} ${startY} L ${fromX} ${dropY} L ${routeX} ${dropY} L ${routeX} ${toY} L ${toX} ${toY}`;
  }

  function splitPropsBySide(propIds) {
    const left = [];
    const right = [];
    (propIds || []).forEach((propId) => {
      const prop = props[propId] || { id: propId, label: propId, side: "right" };
      if (prop.side === "left") left.push(prop);
      else right.push(prop);
    });
    return { left, right };
  }

  function renderPropDocChip(prop, x, y) {
    const fill = prop.bg || theme.bg;
    const strokeCol = prop.borderColor || theme.stroke;
    const labelColor = prop.textColor || theme.title;
    const maxLen =
      typeof prop.maxChars === "number" && prop.maxChars > 0
        ? prop.maxChars
        : 9;
    const tip = prop.title || prop.label || prop.id;
    return (
      <>
        <title>{tip}</title>
        <path
          d={`M ${x} ${y} H ${x + docW - 8} L ${x + docW} ${y + 8} V ${y + docH} H ${x} Z`}
          fill={fill}
          stroke={strokeCol}
          strokeWidth="1.1"
        />
        <path
          d={`M ${x + docW - 8} ${y} V ${y + 8} H ${x + docW}`}
          fill="none"
          stroke={strokeCol}
          strokeWidth="1"
        />
        <text
          x={x + docW / 2 - 2}
          y={y + 12}
          textAnchor="middle"
          fontFamily="'JetBrains Mono',monospace"
          fontSize="9"
          fill={labelColor}
        >
          {truncate(prop.label || prop.id, maxLen)}
        </text>
      </>
    );
  }

  for (let i = 1; i < stepRows.length; i++) {
    const prev = stepRows[i - 1];
    const cur = stepRows[i];
    const prevCase = caseOfStep(prev.i);
    const curCase = caseOfStep(cur.i);
    if (
      prevCase &&
      curCase &&
      (prevCase.frame !== curCase.frame ||
        prevCase.caseIdx !== curCase.caseIdx)
    )
      continue;
    if (prevCase && !curCase) continue;
    if (!prevCase && curCase) continue;
    let hasBranchBetween = false;
    for (let j = prev.i + 1; j < cur.i; j++) {
      if (rows[j]?.kind === "branchStart") {
        hasBranchBetween = true;
        break;
      }
    }
    if (hasBranchBetween) continue;
    if (rows[prev.i + 1]?.kind === "branchStart") continue;
    const fromIdx = laneIndex(prev.r.role);
    const toIdx = laneIndex(cur.r.role);
    if (fromIdx < 0 || toIdx < 0) continue;
    const fromX = nodeCenterX(prev.i, prev.r.role);
    const toX = nodeCenterX(cur.i, cur.r.role);
    const prevCy = stepBlockCenterY(prev.i);
    const curCy = stepBlockCenterY(cur.i);
    connectors.push({
      fromX,
      toX,
      y1: prevCy + 22,
      y2: curCy - 22,
      key: `c-${i}`,
    });
  }

  const firstStep = stepRows[0];
  const frameById = new Map(frames.map((f) => [f.id, f]));
  function endTerminalAnchor() {
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (row.kind === "step" && !row.empty && row.role) {
        return {
          x: nodeCenterX(i, row.role),
          sourceY: stepBlockCenterY(i) + 22,
        };
      }
      if (row.kind === "branchEnd") {
        const frame = frameById.get(row.id);
        if (!frame) continue;
        const mergeCenterX = frameAnchorX(frame);
        const mergeBottomY = frame.yMerge + mergeH / 2 + 14;
        return {
          x: mergeCenterX,
          sourceY: mergeBottomY,
        };
      }
    }
    return null;
  }
  const lastAnchor = endTerminalAnchor();
  const hasStartTerminal = Boolean(firstStep && laneIndex(firstStep.r.role) >= 0);
  const hasEndTerminal = Boolean(lastAnchor);
  const startTerminal = hasStartTerminal
    ? {
        x: nodeCenterX(firstStep.i, firstStep.r.role),
        y: stepBlockCenterY(firstStep.i) - 22 - terminalGap,
        targetY: stepBlockCenterY(firstStep.i) - 22,
      }
    : null;
  const endTerminal = hasEndTerminal && lastAnchor
    ? {
        x: lastAnchor.x,
        y: lastAnchor.sourceY + terminalGap,
        sourceY: lastAnchor.sourceY,
      }
    : null;
  const endTerminalBottom = endTerminal
    ? endTerminal.y + terminalRadius + 16
    : 0;
  const height = Math.max(y + baseBottomPadding, endTerminalBottom);
  const leftGutterBodyH = Math.max(0, height - (headerH + 24) - 20 + 24);
  const leftGutterBodyBottomY = headerH + leftGutterBodyH;

  let lastStepRowIndex = -1;
  for (let idx = rows.length - 1; idx >= 0; idx--) {
    const row = rows[idx];
    if (row.kind === "step" && !row.empty && row.role) {
      lastStepRowIndex = idx;
      break;
    }
  }
  const stepRowDividerYs = [];
  if (lanes.length > 0 && lastStepRowIndex >= 0) {
    rows.forEach((row, i) => {
      if (row.kind === "branchEnd") {
        const meta = rowMeta[i];
        if (meta != null) stepRowDividerYs.push(meta.y + mergeH);
        return;
      }
      if (row.kind !== "step" || row.empty || !row.role || i === lastStepRowIndex)
        return;
      const meta = rowMeta[i];
      if (meta == null) return;

      const next = rows[i + 1];
      let yLine =
        meta.y + (stepRowHeightByIndex.get(i) ?? stepRowHeight(row, i));
      if (next?.kind === "step" && next.skipIndex) return;

      /** If the next row is the if (decision), draw the swimlane line under the diamond, not above it. */
      if (next?.kind === "branchStart") {
        const branchMeta = rowMeta[i + 1];
        if (branchMeta != null) yLine = branchMeta.y + diamondH;
      }
      stepRowDividerYs.push(yLine);
    });
  }
  const swimlaneDividerX1 = xPad;
  const swimlaneDividerX2 =
    lanes.length > 0 ? laneX(lanes.length - 1) + laneWidth(lanes.length - 1) : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        height: "auto",
        background: theme.bg,
        display: "block",
      }}
      id="swimlane-svg"
    >
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.stroke} />
        </marker>
        <pattern
          id="gridp"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke={theme.grid}
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      {title && (
        <text
          x={width / 2}
          y={40}
          textAnchor="middle"
          fill={theme.title}
          fontFamily="'Shippori Mincho','Noto Serif JP',Georgia,serif"
          fontSize="24"
          fontWeight="600"
          letterSpacing="0.05em"
        >
          {title}
        </text>
      )}

      <rect
        width={width}
        height={height}
        fill="url(#gridp)"
        opacity="0.5"
      />

      {/* left gutter (bottom border: 1.2px solid theme.stroke) */}
      <rect
        x={xPad}
        y={topPad}
        width={leftGutter}
        height={headerH}
        fill="white"
        opacity="0.9"
      />
      <line
        x1={xPad}
        x2={xPad + leftGutter}
        y1={topPad + headerH}
        y2={topPad + headerH}
        stroke={theme.stroke}
        strokeWidth="1.2"
        vectorEffect="non-scaling-stroke"
      />

      <rect
        x={xPad}
        y={headerH}
        width={leftGutter}
        height={leftGutterBodyH}
        fill="none"
        stroke={theme.stroke}
        strokeWidth="1.2"
      />

      {rows.map((r, i) => {
        if (r.kind !== "step" || r.empty || !r.role) return null;
        if (r.skipIndex) return null;
        const yRow = rowMeta[i]?.y;
        if (yRow == null) return null;
        const d = stepRowDisplay.get(i);
        const titleText = (r.name || r.text || "").trim();
        const hasNum = d && !d.skipped && d.displayIndex != null;
        const prefix = hasNum ? `${d.displayIndex}. ` : "";
        if (!titleText && !r.description) return null;
        return (
          <g key={`step-left-${i}`}>
            {titleText && (
              <text
                x={12 + xPad}
                y={yRow + 30}
                fill={theme.title}
                fontFamily="'Noto Sans JP',sans-serif"
                fontSize="12"
                fontWeight="600"
              >
                {prefix}
                {truncate(titleText, 28)}
              </text>
            )}
            {r.description?.trim() && (() => {
              const visualLines = wrapDescriptionToVisualLines(
                r.description.trim(),
                28
              );
              const descY = titleText ? yRow + 50 : yRow + 30;
              const descX = 12 + xPad;
              return (
                <text
                  x={descX}
                  y={descY}
                  fill={theme.laneText || theme.title}
                  opacity="0.78"
                  fontFamily="'Noto Sans JP',sans-serif"
                  fontSize="10"
                  fontWeight="400"
                >
                  {visualLines.map((runs, li) => (
                    <tspan
                      key={li}
                      x={descX}
                      dy={li === 0 ? 0 : descriptionLineHeight}
                    >
                      {runs.map((run, ri) => (
                        <tspan
                          key={ri}
                          fontWeight={run.bold ? "600" : "400"}
                          fontStyle={run.italic ? "italic" : "normal"}
                          textDecoration={run.strike ? "line-through" : "none"}
                        >
                          {run.text}
                        </tspan>
                      ))}
                    </tspan>
                  ))}
                </text>
              );
            })()}
          </g>
        );
      })}

      {/* Swimlane columns and lane headers */}
      {lanes.map((lane, i) => {
        const x = laneX(i);
        const currentLaneW = laneWidth(i);
        const bg = lane.bg || theme.laneFills[i % theme.laneFills.length];
        const txt = lane.textColor || theme.laneText;
        return (
          <g key={`lane-${i}`}>
            <rect
              x={x}
              y={topPad}
              width={currentLaneW}
              height={height - topPad - 20}
              fill={bg}
              opacity="0.12"
            />
            <rect
              x={x}
              y={topPad}
              width={currentLaneW}
              height={headerH}
              fill={bg}
              opacity="0.9"
            />
            {lane.icon && (
              <g>
                <circle
                  cx={x + 28}
                  cy={topPad + headerH / 2}
                  r="16"
                  fill={theme.bg}
                  stroke={txt}
                  strokeWidth="1.2"
                />
                <text
                  x={x + 28}
                  y={topPad + headerH / 2 + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fill={txt}
                  fontFamily="'Noto Sans JP',sans-serif"
                  fontWeight="600"
                >
                  {lane.label?.[0] || lane.id[0]}
                </text>
              </g>
            )}
            <text
              x={lane.icon ? x + 54 : x + currentLaneW / 2}
              y={topPad + headerH / 2 + (lane.icon ? 0 : 6)}
              textAnchor={lane.icon ? "start" : "middle"}
              fill={txt}
              fontFamily="'Noto Sans JP',sans-serif"
              fontSize="15"
              fontWeight="700"
              letterSpacing="0.06em"
            >
              {lane.label}
            </text>
            {lane.icon && (
              <text
                x={x + 54}
                y={topPad + headerH / 2 + 18}
                textAnchor="start"
                fill={txt}
                fontFamily="'JetBrains Mono',monospace"
                fontSize="10"
                opacity="0.7"
              >
                {lane.id}
              </text>
            )}
            <line
              style={{ color: "red" }}
              x1={x}
              x2={x + currentLaneW}
              y1={topPad + headerH}
              y2={topPad + headerH}
              stroke={theme.stroke}
              // stroke="#FF0000"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}

      {stepRowDividerYs.map((yLine, di) => (
        <line
          key={`step-row-div-${di}`}
          x1={swimlaneDividerX1}
          y1={yLine}
          x2={swimlaneDividerX2}
          y2={yLine}
          stroke={theme.grid}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          opacity="0.95"
        />
      ))}

      {/* Lane debug outline: after row dividers so red stroke paints on top (SVG order). */}
      {lanes.map((lane, i) => (
        <rect
          key={`lane-debug-outline-${lane.id ?? i}`}
          x={laneX(i)}
          y={topPad}
          width={laneWidth(i)}
          height={height - topPad - 20}
          fill="none"
          stroke={theme.stroke}
          strokeWidth="1.2"
        />
      ))}

      {/* Branch core: decision diamond (if) and merge diamond (endif) */}
      {frames.map((f) => {
        if (f.yMerge == null) return null;

        const dCx = frameAnchorX(f);
        const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
        const dW = Math.max(140, (f.cond.length + 4) * 9);
        const dH = 50;
        const decisionStyle = resolveBranchStyle(f.decisionColor);

        const mCx = frameAnchorX(f);
        const mCy = f.yMerge + mergeH / 2;
        const mW = 40;
        const mH = 28;

        const diamondPath = (cx, cy, w, h) =>
          `M ${cx} ${cy - h / 2} L ${cx + w / 2} ${cy} L ${cx} ${cy + h / 2} L ${cx - w / 2} ${cy} Z`;

        return (
          <g key={`branch-${f.id}`}>
            <path
              d={diamondPath(dCx, dCy, dW, dH)}
              fill={theme.branchBg}
              stroke={theme.branch}
              strokeWidth="1.8"
            />
            <text
              x={dCx}
              y={dCy + 4}
              textAnchor="middle"
              fontFamily="'Noto Sans JP',sans-serif"
              fontSize="13"
              fontWeight="600"
              fill={theme.branch}
            >
              {truncate(f.cond, 16)}
            </text>

            {/* Branch fan-out: decision -> each case path */}
            {f.cases.map((c, ci) => {
              const child = c.childFrame;
              const directStepIdx = firstDirectStepIdx(c);
              const targetsNestedDecision =
                child != null && directStepIdx == null;

              let targetY;
              let targetX = caseAnchorX(c);
              let caseLaneWidth = minLaneW;
              let showArrow = false;

              if (targetsNestedDecision) {
                targetX = frameAnchorX(child);
                targetY =
                  child.yDecision + diamondH / 2 + decisionYOffset - 22;
                const li = laneIndexForX(targetX);
                if (li >= 0) caseLaneWidth = laneWidth(li);
              } else if (directStepIdx != null) {
                targetY = stepBlockCenterY(directStepIdx) - 22;
                const r = rows[directStepIdx];
                if (r.role) {
                  const li = laneIndex(r.role);
                  if (li >= 0) {
                    targetX = nodeCenterX(directStepIdx, r.role);
                    caseLaneWidth = laneWidth(li);
                  }
                }
                showArrow = true;
              } else {
                targetY = mCy - mH / 2 - 4;
              }

              const startX = dCx;
              const startY = dCy + dH / 2;
              const sideOffset = c.offset || 0;
              const bendY = startY + branchCaseBendYOffset;
              const sideX = targetX;
              const laneSafeMin = targetX - caseLaneWidth / 2 + 16;
              const laneSafeMax = targetX + caseLaneWidth / 2 - 16;
              const clampedSideX = Math.max(
                laneSafeMin,
                Math.min(laneSafeMax, sideX),
              );
              const needsElbow =
                Math.abs(targetX - startX) > 0.5 || (showArrow && sideOffset !== 0);
              const edgeD =
                showArrow && sideOffset !== 0
                  ? `M ${startX} ${startY} L ${startX} ${bendY} L ${clampedSideX} ${bendY} L ${clampedSideX} ${targetY}`
                  : needsElbow
                    ? `M ${startX} ${startY} L ${startX} ${bendY} L ${targetX} ${bendY} L ${targetX} ${targetY}`
                    : `M ${startX} ${startY} L ${targetX} ${targetY}`;

              return (
                <g key={`case-${f.id}-${ci}`}>
                  <path
                    d={edgeD}
                    fill="none"
                    stroke={theme.stroke}
                    strokeWidth="1.6"
                    markerEnd={showArrow ? "url(#arrowhead)" : undefined}
                  />
                </g>
              );
            })}

            {/* Branch fan-in: each case path -> merge or loop back to decision */}
            {f.cases.map((c, ci) => {
              const anchor = loopAnchorInCase(c.rowIndices, f.id);
              if (anchor) {
                let fromX;
                let fromBottomY;
                let sourceStepIdx = null;
                if (anchor.prevStepIdx != null) {
                  sourceStepIdx = anchor.prevStepIdx;
                  const r = rows[anchor.prevStepIdx];
                  const li = laneIndex(r.role);
                  fromX =
                    li >= 0 ? nodeCenterX(anchor.prevStepIdx, r.role) : c.x;
                  fromBottomY = stepBlockBottomY(anchor.prevStepIdx);
                } else {
                  fromX = c.x;
                  const loopY = rowMeta[anchor.loopIdx]?.y ?? f.yDecision;
                  fromBottomY =
                    loopY +
                    (stepRowHeightByIndex.get(anchor.loopIdx) || branchLoopH);
                }
                const d = buildLoopBackPath({
                  fromX,
                  fromBottomY,
                  dCx,
                  dCy,
                  dW,
                  frame: f,
                  sourceStepIdx,
                  caseOffset: c.offset || 0,
                });
                return (
                  <path
                    key={`loop-${f.id}-${ci}`}
                    d={d}
                    fill="none"
                    stroke={theme.stroke}
                    strokeWidth="1.6"
                    markerEnd="url(#arrowhead)"
                  />
                );
              }

              const mergeFrom = caseMergeAnchor(c);
              let fromX;
              let fromY;
              if (mergeFrom) {
                fromX = mergeFrom.fromX;
                fromY = mergeFrom.fromY;
              } else {
                fromX = caseAnchorX(c);
                fromY = f.yDecision + diamondH - 4;
              }
              const toX = mCx;
              const toY = mCy - mH / 2;
              const bendY2 = toY - 14;
              const sideOffset = c.offset || 0;
              const needsMergeElbow =
                Math.abs(fromX - toX) > 0.5 || sideOffset !== 0;
              const d = needsMergeElbow
                ? `M ${fromX} ${fromY} L ${fromX} ${bendY2} L ${toX} ${bendY2} L ${toX} ${toY}`
                : `M ${fromX} ${fromY} L ${toX} ${toY}`;
              return (
                <path
                  key={`mrg-${f.id}-${ci}`}
                  d={d}
                  fill="none"
                  stroke={theme.stroke}
                  strokeWidth="1.6"
                />
              );
            })}

            <path
              d={diamondPath(mCx, mCy, mW, mH)}
              fill={theme.branchBg}
              stroke={theme.branch}
              strokeWidth="1.6"
            />
          </g>
        );
      })}

      {/* Sequential flow connectors between normal step nodes */}
      {connectors.map((c) => {
        if (Math.abs(c.fromX - c.toX) < 0.5) {
          const x = c.fromX;
          return (
            <line
              key={c.key}
              x1={x}
              y1={c.y1}
              x2={x}
              y2={c.y2}
              stroke={theme.stroke}
              strokeWidth="1.6"
              markerEnd="url(#arrowhead)"
            />
          );
        }
        const x1 = c.fromX;
        const x2 = c.toX;
        const mid = (c.y1 + c.y2) / 2;
        const d = `M ${x1} ${c.y1} L ${x1} ${mid} L ${x2} ${mid} L ${x2} ${c.y2}`;
        return (
          <path
            key={c.key}
            d={d}
            fill="none"
            stroke={theme.stroke}
            strokeWidth="1.6"
            markerEnd="url(#arrowhead)"
          />
        );
      })}

      {/* Start/end terminals for the outer flow */}
      {startTerminal && (
        <>
          <line
            x1={startTerminal.x}
            y1={startTerminal.y + terminalRadius}
            x2={startTerminal.x}
            y2={startTerminal.targetY}
            stroke={theme.stroke}
            strokeWidth="1.6"
            markerEnd="url(#arrowhead)"
          />
          <circle
            cx={startTerminal.x}
            cy={startTerminal.y}
            r={terminalRadius}
            fill={theme.stroke}
          />
        </>
      )}
      {endTerminal && (
        <>
          <line
            x1={endTerminal.x}
            y1={endTerminal.sourceY}
            x2={endTerminal.x}
            y2={endTerminal.y - terminalRadius}
            stroke={theme.stroke}
            strokeWidth="1.6"
            markerEnd="url(#arrowhead)"
          />
          <circle
            cx={endTerminal.x}
            cy={endTerminal.y}
            r={terminalRadius}
            fill={theme.stroke}
          />
        </>
      )}

      {/* Connect outer flow: previous step -> decision, merge -> next step */}
      {frames.map((f) => {
        const startIdx = rows.findIndex(
          (r) => r.kind === "branchStart" && r.id === f.id
        );
        let prevStepIdx = -1;
        for (let j = startIdx - 1; j >= 0; j--) {
          const row = rows[j];
          if (row.kind === "step" && !row.empty && row.role) {
            prevStepIdx = j;
            break;
          }
          // Same-frame case header, or parent/sibling case (nested if must not
          // connect across elseif/else into another branch).
          if (
            row.kind === "branchCase" &&
            (row.id === f.id ||
              (row.depth != null && row.depth < f.depth))
          )
            break;
          if (row.kind === "branchStart" && row.depth < f.depth) break;
          if (row.kind === "branchEnd") break;
        }
        const endIdx = rows.findIndex(
          (r) => r.kind === "branchEnd" && r.id === f.id
        );
        let nextStepIdx = -1;
        for (let j = endIdx + 1; j < rows.length; j++) {
          const row = rows[j];
          if (row.kind === "step" && !row.empty && row.role) {
            if (f.depth === 0 || row.depth > f.depth) {
              nextStepIdx = j;
              break;
            }
            continue;
          }
          if (f.depth === 0 && row.kind === "branchStart") break;
          if (f.depth > 0 && row.depth != null && row.depth <= f.depth) break;
        }

        const dCx = frameAnchorX(f);
        const dTopY = f.yDecision + diamondH / 2 + decisionYOffset - 25;
        const mCx = dCx;
        const mBotY = f.yMerge + mergeH / 2 + 14;

        const edges = [];
        if (prevStepIdx >= 0) {
          const r = rows[prevStepIdx];
          const li = laneIndex(r.role);
          const sx = li >= 0 ? nodeCenterX(prevStepIdx, r.role) : dCx;
          const sy = stepBlockCenterY(prevStepIdx) + 22;
          const bend = (sy + dTopY) / 2;
          const d =
            sx === dCx
              ? `M ${sx} ${sy} L ${dCx} ${dTopY}`
              : `M ${sx} ${sy} L ${sx} ${bend} L ${dCx} ${bend} L ${dCx} ${dTopY}`;
          edges.push(
            <path
              key={`in-${f.id}`}
              d={d}
              fill="none"
              stroke={theme.stroke}
              strokeWidth="1.6"
              markerEnd="url(#arrowhead)"
            />
          );
        }
        if (nextStepIdx >= 0) {
          const r = rows[nextStepIdx];
          const li = laneIndex(r.role);
          const tx = li >= 0 ? nodeCenterX(nextStepIdx, r.role) : mCx;
          const ty = stepBlockCenterY(nextStepIdx) - 22;
          const bend = (mBotY + ty) / 2;
          const d =
            tx === mCx
              ? `M ${mCx} ${mBotY} L ${tx} ${ty}`
              : `M ${mCx} ${mBotY} L ${mCx} ${bend} L ${tx} ${bend} L ${tx} ${ty}`;
          edges.push(
            <path
              key={`out-${f.id}`}
              d={d}
              fill="none"
              stroke={theme.stroke}
              strokeWidth="1.6"
              markerEnd="url(#arrowhead)"
            />
          );
        }
        return <g key={`io-${f.id}`}>{edges}</g>;
      })}

      {/* Step nodes: task blocks (plus empty-step dots) */}
      {rows.map((r, i) => {
        const yRow = rowMeta[i]?.y;
        if (yRow == null || r.kind !== "step") return null;

        if (r.empty) {
          return (
            <circle
              key={`step-${i}`}
              cx={width / 2}
              cy={stepBlockCenterY(i)}
              r="5"
              fill={theme.stroke}
              opacity="0.35"
            />
          );
        }
        const idx = laneIndex(r.role);
        if (idx < 0) return null;
        const lane = lanes[idx];
        const block = r.blockRef ? blocks[r.blockRef] : null;
        const cx = nodeCenterX(i, r.role);
        const cy = stepBlockCenterY(i);
        const boxW = nodeW;
        const boxH = 44;

        const fill = (block && block.bg) || lane.bg || theme.boxBg;
        const txtColor =
          (block && block.textColor) || lane.textColor || theme.boxText;
        const stroke = (block && block.borderColor) || theme.stroke;
        const shape = (block && block.shape) || "rounded";
        const blockIcon = block && block.icon;
        const { left: leftProps, right: rightProps } = splitPropsBySide(r.props);
        const docY = cy + boxH / 2 - 8;

        return (
          <g key={`step-${i}`}>
            <StepShape
              shape={shape}
              cx={cx}
              cy={cy}
              w={boxW}
              h={boxH}
              fill={fill}
              stroke={stroke}
            />
            {blockIcon && (
              <BlockIcon
                icon={blockIcon}
                x={cx - boxW / 2}
                y={cy}
                size={16}
                color={txtColor}
                shape={shape}
              />
            )}
            <text
              x={blockIcon ? cx + 8 : cx}
              y={cy + 5}
              textAnchor="middle"
              fill={txtColor}
              fontFamily="'Noto Sans JP',sans-serif"
              fontSize="13"
              fontWeight="500"
            >
              {truncate(r.text, blockIcon ? 18 : 22)}
            </text>
            {showStepBlockCaptions && r.blockRef && (
              <text
                x={cx + boxW / 2 - 4}
                y={cy - boxH / 2 - 5}
                textAnchor="end"
                fontSize="8"
                fontFamily="'JetBrains Mono',monospace"
                opacity="0.45"
              >
                {r.blockRef}
              </text>
            )}
            {showStepBlockCaptions && shape && (
              <text
                x={cx - boxW / 2 + 4}
                y={cy - boxH / 2 - 5}
                textAnchor="start"
                fontSize="8"
                fontFamily="'JetBrains Mono',monospace"
                opacity="0.45"
              >
                {shape.toUpperCase()}
              </text>
            )}
            {[...leftProps].reverse().map((prop, docIdx) => {
              const x = cx - boxW / 2 + 55 - docW + docIdx * docGapX;
              const y = docY + docIdx * docGapY;
              return (
                <g key={`prop-left-${i}-${prop.id}`}>
                  {renderPropDocChip(prop, x, y)}
                </g>
              );
            })}
            {rightProps.map((prop, docIdx) => {
              const x = cx + boxW / 2 - 60 + docIdx * docGapX;
              const y = docY + docIdx * docGapY;
              return (
                <g key={`prop-right-${i}-${prop.id}`}>
                  {renderPropDocChip(prop, x, y)}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Split labels overlay: draw last so they stay above all diagram elements */}
      {frames.map((f) => {
        if (f.yMerge == null) return null;

        const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
        const dH = 50;

        return f.cases.map((c, ci) => {
          if (/^else$/i.test((c.label || "").trim())) return null;

          const firstStepIdx = c.rowIndices.find(
            (idx) => rows[idx].kind === "step"
          );
          let targetY;
          let targetX = c.x;
          if (firstStepIdx != null) {
            const sy = rowMeta[firstStepIdx]?.y;
            targetY = stepBlockCenterY(firstStepIdx) - 22;
            const r = rows[firstStepIdx];
            if (r.role) {
              const li = laneIndex(r.role);
              if (li >= 0) targetX = nodeCenterX(firstStepIdx, r.role);
            }
          } else {
            const mCy = f.yMerge + mergeH / 2;
            const mH = 28;
            targetY = mCy - mH / 2 - 4;
          }

          const startY = dCy + dH / 2;
          const bendY = startY + branchCaseBendYOffset;
          const labelX = targetX;
          const labelY = bendY + 18;
          const labelW = (c.label.length + 2) * 8.5;
          const caseStyle = resolveBranchStyle(c.color);

          return (
            <g key={`case-label-overlay-${f.id}-${ci}`}>
              <rect
                x={labelX - labelW / 2}
                y={labelY - 11}
                width={labelW}
                height={20}
                rx="3"
                fill={caseStyle.bg}
                fillOpacity="0.8"
                stroke={caseStyle.stroke}
                strokeWidth="0.9"
              />
              <text
                x={labelX}
                y={labelY + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fontFamily="'Noto Sans JP',sans-serif"
                fill={caseStyle.stroke}
              >
                {c.label}
              </text>
            </g>
          );
        });
      })}
    </svg>
  );
}
