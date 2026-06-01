// Auto-generated from diagram/diagram.jsx by scripts/generate-diagram-pure.mjs
// Do not edit manually — re-run the script after changing diagram.jsx.

import { truncate, wrapDescriptionToVisualLines, wrapTextToDisplayColumns } from "../utils.js";
import { buildStepRowDisplayInfo } from "../parser.js";
import {
  findNextFlowStepAfterBranchEnd,
  findNextSiblingBranchStart,
} from "../branch-rows.js";
import { StepShape } from "./step-shape.js";
import { BlockIcon } from "./block-icon.js";
import { h, Fragment } from "./svg-utils.js";
const BRANCH_COLOR_STYLES = {
  blue: { stroke: "#2563eb", bg: "#dbeafe" },
  green: { stroke: "#15803d", bg: "#dcfce7" },
  red: { stroke: "#b91c1c", bg: "#fee2e2" },
  orange: { stroke: "#c2410c", bg: "#ffedd5" },
  purple: { stroke: "#7e22ce", bg: "#f3e8ff" },
  gray: { stroke: "#374151", bg: "#f3f4f6" },
  black: { stroke: "#111827", bg: "#e5e7eb" }
};
function PageTriColumnText({ y, width, xPad, left, center, right, fill, fontSize = 11 }) {
  const fontFamily = "'Shippori Mincho','Noto Serif JP',Georgia,serif";
  return /* @__PURE__ */ h(Fragment, null, left?.trim() && /* @__PURE__ */ h(
    "text",
    {
      x: xPad,
      y,
      textAnchor: "start",
      fill,
      fontFamily,
      fontSize
    },
    left.trim()
  ), center?.trim() && /* @__PURE__ */ h(
    "text",
    {
      x: width / 2,
      y,
      textAnchor: "middle",
      fill,
      fontFamily,
      fontSize
    },
    center.trim()
  ), right?.trim() && /* @__PURE__ */ h(
    "text",
    {
      x: width - xPad,
      y,
      textAnchor: "end",
      fill,
      fontFamily,
      fontSize
    },
    right.trim()
  ));
}
function RowSelectionHighlight({ x, y, w, h: h2 }) {
  return /* @__PURE__ */ h2(
    "rect",
    {
      "data-export-hide": true,
      x,
      y,
      width: w,
      height: h2,
      fill: "#2563eb",
      fillOpacity: 0.1,
      stroke: "#2563eb",
      strokeWidth: 2,
      rx: 6,
      pointerEvents: "none"
    }
  );
}
function RowHitTarget({ rowIndex, x, y, w, h: h2, selected, onSelect }) {
  return /* @__PURE__ */ h2(
    "rect",
    {
      "data-export-hide": true,
      x,
      y,
      width: w,
      height: h2,
      fill: "transparent",
      pointerEvents: "all",
      cursor: "pointer",
      stroke: selected ? "#2563eb" : "none",
      strokeWidth: selected ? 2.5 : 0,
      rx: 4,
      onClick: (event) => {
        event.stopPropagation();
        onSelect?.(rowIndex);
      }
    }
  );
}
function PathHitTarget({ rowIndex, d, onSelect }) {
  return /* @__PURE__ */ h(
    "path",
    {
      "data-export-hide": true,
      d,
      fill: "none",
      stroke: "transparent",
      strokeWidth: "18",
      pointerEvents: "stroke",
      cursor: "pointer",
      onClick: (event) => {
        event.stopPropagation();
        onSelect?.(rowIndex);
      }
    }
  );
}
function renderDiagramSvg({
  model,
  theme,
  showStepBlockCaptions = true,
  mergeAtPreviousBlock = true,
  interactive = false,
  selectedRowIndex = null,
  onRowSelect
}) {
  const { title, page = {}, lanes, rows, blocks = {}, props = {} } = model;
  const pageDescription = (page.description || "").trim();
  const hasPageHeader = Boolean(
    page.headerLeft?.trim() || page.headerCenter?.trim() || page.headerRight?.trim()
  );
  const hasPageFooter = Boolean(
    page.footerLeft?.trim() || page.footerCenter?.trim() || page.footerRight?.trim()
  );
  const minLaneW = 220;
  const maxLaneW = 360;
  const nodeW = 188;
  const xPad = 40;
  const leftGutter = 300;
  const headerH = 72;
  const rowH = 80;
  const docW = 65;
  const docH = 40;
  const docGapX = 8;
  const docGapY = 18;
  const propRowExtraHBase = 20;
  const propExtraWPerProps = docGapX;
  const propRowExtraHPerProps = docGapY;
  const descriptionLineHeight = 14;
  const descriptionBottomPad = 10;
  const caseSpread = 100;
  const diamondH = 90;
  const mergeH = 60;
  const branchLoopH = 12;
  const decisionYOffset = -15;
  const branchCaseBendYOffset = 10;
  const stepBoxH = 44;
  const loopRouteMargin = 32;
  const loopDropPad = 14;
  const pageDescLines = pageDescription ? wrapTextToDisplayColumns(pageDescription, 48) : [];
  const pageDescLineHeight = 16;
  const pageFooterPad = hasPageFooter ? 28 : 0;
  let pageHeaderY = null;
  let titleY = null;
  let pageDescStartY = null;
  let topPad = 32;
  if (!hasPageHeader && !pageDescription && title) {
    topPad = 72;
    titleY = 40;
  } else if (!hasPageHeader && !pageDescription && !title) {
    topPad = 32;
  } else {
    let layoutY = 14;
    if (hasPageHeader) {
      pageHeaderY = layoutY + 12;
      layoutY += 22;
    }
    if (title) {
      titleY = layoutY + 22;
      layoutY += 30;
    }
    if (pageDescLines.length > 0) {
      pageDescStartY = layoutY + 8;
      layoutY += pageDescLines.length * pageDescLineHeight + 12;
    }
    topPad = Math.max(layoutY + 12, title || pageDescLines.length > 0 ? 72 : 32);
  }
  const rowMeta = [];
  let y = topPad + headerH + 24;
  const frames = [];
  const frameStack = [];
  const laneIndexById = new Map(lanes.map((lane, idx) => [lane.id, idx]));
  const stepRowDisplay = buildStepRowDisplayInfo(rows);
  const stepRowHeightByIndex = /* @__PURE__ */ new Map();
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
  function stepDescriptionExtraHeight(row, rowIndex, heightWithProps) {
    const desc = (row?.description || "").trim();
    if (!desc) return 0;
    const titleText = (row.name || row.text || "").trim();
    const visualLines = wrapDescriptionToVisualLines(desc, 28);
    if (visualLines.length === 0) return 0;
    const descStartOffset = titleText ? 40 : 20;
    const extent = descStartOffset + visualLines.length * descriptionLineHeight + descriptionBottomPad;
    let descExtra = Math.max(0, extent - heightWithProps);
    if (descExtra <= 0) return 0;
    const next = rows[rowIndex + 1];
    if (next?.kind === "step" && !next.empty && next.role && next.skipIndex) {
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
    const propExtra = (maxPropsPerSide > 0 && propRowExtraHBase) + Math.max(0, maxPropsPerSide - 1) * propRowExtraHPerProps;
    const heightWithProps = rowH + propExtra;
    const descExtra = stepDescriptionExtraHeight(row, rowIndex, heightWithProps);
    return heightWithProps + descExtra;
  }
  function rowCenterY(rowIndex) {
    const yRow = rowMeta[rowIndex]?.y ?? 0;
    const h2 = stepRowHeightByIndex.get(rowIndex) || rowH;
    return yRow + h2 / 2;
  }
  function stepBlockCenterY(rowIndex) {
    const row = rows[rowIndex];
    if (row?.kind === "step") {
      const yRow = rowMeta[rowIndex]?.y ?? 0;
      return yRow + rowH / 2;
    }
    return rowCenterY(rowIndex);
  }
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
    let width2 = base;
    for (const ch of text) width2 += /[ -~]/.test(ch) ? 8 : 14;
    return width2;
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
        cases: r.firstCase && String(r.firstCase).trim() ? [
          {
            label: r.firstCase.trim(),
            color: r.branchColor || null,
            rowIndices: [],
            startRow: i
          }
        ] : [],
        parentCase: null,
        anchorX: null
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
          startRow: i
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
      const h2 = stepRowHeight(r, i);
      stepRowHeightByIndex.set(i, h2);
      rowMeta[i] = { y, kind: "step" };
      pushToActiveCase(i);
      y += h2;
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
  function firstDirectStepAfterChild(c) {
    const child = c.childFrame;
    if (!child) return null;
    const childEndIdx = child.endRow ?? rows.findIndex((r) => r.kind === "branchEnd" && r.id === child.id);
    return c.rowIndices.find((idx) => {
      const row = rows[idx];
      return row?.kind === "step" && !row.empty && row.role && (childEndIdx < 0 || idx > childEndIdx);
    });
  }
  function firstStepIdxInCase(c) {
    return c.rowIndices.find((idx) => rows[idx]?.kind === "step");
  }
  function lastStepIdxInCase(c) {
    for (let k = c.rowIndices.length - 1; k >= 0; k--) {
      const idx = c.rowIndices[k];
      if (rows[idx]?.kind === "step") return idx;
    }
    return null;
  }
  function caseStepLineTarget(stepIdx, caseHint) {
    const row = rows[stepIdx];
    if (!row || row.kind !== "step") return null;
    if (row.empty) {
      const c = caseHint ?? findCaseForStep(stepIdx);
      return {
        x: c ? caseAnchorX(c) : width / 2,
        y: stepBlockCenterY(stepIdx),
        showArrow: false
      };
    }
    if (!row.role) return null;
    const li = laneIndex(row.role);
    return {
      x: li >= 0 ? nodeCenterX(stepIdx, row.role) : width / 2,
      y: stepBlockCenterY(stepIdx) - 22,
      showArrow: true
    };
  }
  function caseStepLineSource(stepIdx, caseHint) {
    const row = rows[stepIdx];
    if (!row || row.kind !== "step") return null;
    if (row.empty) {
      const c = caseHint ?? findCaseForStep(stepIdx);
      return {
        x: c ? caseAnchorX(c) : width / 2,
        y: stepBlockCenterY(stepIdx) + 8
      };
    }
    if (!row.role) return null;
    const li = laneIndex(row.role);
    return {
      x: li >= 0 ? nodeCenterX(stepIdx, row.role) : width / 2,
      y: stepBlockCenterY(stepIdx) + 22
    };
  }
  function caseMergeAnchor(c) {
    const childFrame = c.childFrame;
    if (childFrame?.yMerge != null) {
      const childEndIdx = childFrame.endRow ?? rows.findIndex(
        (r) => r.kind === "branchEnd" && r.id === childFrame.id
      );
      const stepsAfterChild = c.rowIndices.filter(
        (idx) => rows[idx]?.kind === "step" && (childEndIdx < 0 || idx > childEndIdx)
      );
      const lastAfterChild = stepsAfterChild[stepsAfterChild.length - 1];
      if (lastAfterChild != null) {
        const src = caseStepLineSource(lastAfterChild, c);
        if (src) return { fromX: src.x, fromY: src.y };
      }
      return {
        fromX: mergeAnchorX(childFrame),
        fromY: childFrame.yMerge + mergeH / 2 - 14
      };
    }
    const lastDirectStepIdx = [...c.rowIndices].reverse().find((idx) => {
      const row = rows[idx];
      return row?.kind === "step" && !row.empty && row.role;
    });
    if (lastDirectStepIdx != null) {
      const r = rows[lastDirectStepIdx];
      const li = laneIndex(r.role);
      return {
        fromX: li >= 0 ? nodeCenterX(lastDirectStepIdx, r.role) : caseAnchorX(c),
        fromY: stepBlockCenterY(lastDirectStepIdx) + 22
      };
    }
    const lastAnyStepIdx = lastStepIdxInCase(c);
    if (lastAnyStepIdx != null) {
      const src = caseStepLineSource(lastAnyStepIdx);
      if (src) return { fromX: src.x, fromY: src.y };
    }
    return null;
  }
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
  function countCasesInLaneIncludingNested(frame, laneId) {
    let siblingsInLane = 0;
    let maxNested = 0;
    for (const c of frame.cases) {
      if (caseTouchesLane(c, laneId)) siblingsInLane++;
      if (c.childFrame) {
        maxNested = Math.max(
          maxNested,
          countCasesInLaneIncludingNested(c.childFrame, laneId)
        );
      }
    }
    if (siblingsInLane > 0 && maxNested > 0) {
      return siblingsInLane + maxNested - 1;
    }
    return Math.max(siblingsInLane, maxNested);
  }
  const frameCaseOffsets = /* @__PURE__ */ new Map();
  const frameSubtreeExtent = /* @__PURE__ */ new Map();
  function computeFrameLayout(frame) {
    frame.cases.forEach((c) => {
      if (c.childFrame) computeFrameLayout(c.childFrame);
    });
    const casesByLane = /* @__PURE__ */ new Map();
    frame.cases.forEach((c, caseIdx) => {
      for (const lane of lanes) {
        if (!caseTouchesLane(c, lane.id)) continue;
        const list = casesByLane.get(lane.id) || [];
        if (!list.includes(caseIdx)) list.push(caseIdx);
        casesByLane.set(lane.id, list);
      }
    });
    const offsets = /* @__PURE__ */ new Map();
    const extents = {};
    for (const lane of lanes) extents[lane.id] = { min: 0, max: 0 };
    casesByLane.forEach((indices, laneId) => {
      const caseExtents = indices.map((ci) => {
        const c = frame.cases[ci];
        let mn = 0;
        let mx = 0;
        if (c.childFrame) {
          const childExt = frameSubtreeExtent.get(c.childFrame.id)?.[laneId];
          if (childExt) {
            mn = Math.min(mn, childExt.min);
            mx = Math.max(mx, childExt.max);
          }
        }
        return { mn, mx };
      });
      const n = indices.length;
      const pos = new Array(n);
      if (n === 1) {
        pos[0] = 0;
      } else {
        for (let k = 0; k < n; k++) {
          pos[k] = (k - (n - 1) / 2) * caseSpread;
        }
        for (let k = 1; k < n; k++) {
          const prevRight = pos[k - 1] + caseExtents[k - 1].mx;
          const required = prevRight + caseSpread - caseExtents[k].mn;
          if (pos[k] < required) pos[k] = required;
        }
        let minOverall = Infinity;
        let maxOverall = -Infinity;
        for (let k = 0; k < n; k++) {
          minOverall = Math.min(minOverall, pos[k] + caseExtents[k].mn);
          maxOverall = Math.max(maxOverall, pos[k] + caseExtents[k].mx);
        }
        const mid = (minOverall + maxOverall) / 2;
        for (let k = 0; k < n; k++) pos[k] -= mid;
      }
      indices.forEach((ci, k) => offsets.set(`${ci}-${laneId}`, pos[k]));
      let mnAll = Infinity;
      let mxAll = -Infinity;
      indices.forEach((ci, k) => {
        mnAll = Math.min(mnAll, pos[k] + caseExtents[k].mn);
        mxAll = Math.max(mxAll, pos[k] + caseExtents[k].mx);
      });
      extents[laneId] = { min: mnAll, max: mxAll };
    });
    frameCaseOffsets.set(frame.id, offsets);
    frameSubtreeExtent.set(frame.id, extents);
  }
  for (const f of frames) {
    if (!f.parentCase) computeFrameLayout(f);
  }
  const stepOffsetByIndex = /* @__PURE__ */ new Map();
  function fillStepOffsets(frame, inheritedByLane) {
    const inherited = inheritedByLane || Object.fromEntries(lanes.map((lane) => [lane.id, 0]));
    const offsets = frameCaseOffsets.get(frame.id);
    const co = (ci, lid) => offsets?.get(`${ci}-${lid}`) || 0;
    frame.cases.forEach((c, caseIdx) => {
      c.rowIndices.forEach((stepIdx) => {
        const row = rows[stepIdx];
        if (row?.kind === "step" && !row.empty && row.role) {
          stepOffsetByIndex.set(
            stepIdx,
            (inherited[row.role] || 0) + co(caseIdx, row.role)
          );
        }
      });
      if (c.childFrame) {
        const childInherited = { ...inherited };
        for (const lane of lanes) {
          childInherited[lane.id] = (childInherited[lane.id] || 0) + co(caseIdx, lane.id);
        }
        fillStepOffsets(c.childFrame, childInherited);
      }
    });
  }
  for (const f of frames) {
    if (!f.parentCase) fillStepOffsets(f, null);
  }
  function stepPropSideCounts(row) {
    const left = [];
    const right = [];
    (row?.props || []).forEach((propId) => {
      const prop = props[propId] || { id: propId, side: "right" };
      if (prop.side === "left") left.push(prop);
      else right.push(prop);
    });
    return { left: left.length, right: right.length };
  }
  function stepRightExtent(row) {
    const { right: n } = stepPropSideCounts(row);
    if (n === 0) return nodeW / 2;
    return nodeW / 2 - 60 + (n - 2) * propExtraWPerProps + docW;
  }
  function stepLeftExtent() {
    return -nodeW / 2;
  }
  const maxCasesPerLane = /* @__PURE__ */ new Map();
  for (const f of frames) {
    if (f.parentCase) continue;
    for (const lane of lanes) {
      const n = countCasesInLaneIncludingNested(f, lane.id);
      const prev = maxCasesPerLane.get(lane.id) || 0;
      maxCasesPerLane.set(lane.id, Math.max(prev, n));
    }
  }
  const stepEdgesByLane = /* @__PURE__ */ new Map();
  rows.forEach((row, i) => {
    if (row.kind !== "step" || row.empty || !row.role) return;
    const off = stepOffsetByIndex.get(i) || 0;
    const left = off + stepLeftExtent();
    const right = off + stepRightExtent(row);
    const cur = stepEdgesByLane.get(row.role);
    if (!cur) stepEdgesByLane.set(row.role, { min: left, max: right });
    else stepEdgesByLane.set(row.role, {
      min: Math.min(cur.min, left),
      max: Math.max(cur.max, right)
    });
  });
  const laneContentPad = 16;
  const laneWidths = lanes.map((lane) => {
    const headerWidth = estimateTextWidth(lane.label || lane.id, lane.icon ? 88 : 64);
    const maxStepWidth = rows.reduce((maxWidth, row) => {
      if (row.kind !== "step" || row.role !== lane.id || row.empty) return maxWidth;
      const stepWidth = estimateTextWidth(row.text, 68);
      return Math.max(maxWidth, stepWidth);
    }, 0);
    const caseCount = maxCasesPerLane.get(lane.id) || 0;
    const branchWidth = caseCount > 1 ? minLaneW + (caseCount - 1) * caseSpread : minLaneW;
    const edges = stepEdgesByLane.get(lane.id);
    const extentWidth = edges ? edges.max - edges.min + laneContentPad * 2 : 0;
    const textPart = Math.max(minLaneW, headerWidth, maxStepWidth);
    return Math.max(Math.min(maxLaneW, textPart), branchWidth, extentWidth);
  });
  const laneOffsets = [];
  let laneCursor = xPad + leftGutter;
  laneWidths.forEach((w, idx) => {
    laneOffsets[idx] = laneCursor;
    laneCursor += w;
  });
  const width = laneCursor + xPad;
  const baseBottomPadding = 50 + pageFooterPad;
  function stepRowBounds(rowIndex) {
    const row = rows[rowIndex];
    const meta = rowMeta[rowIndex];
    if (!row || !meta || row.kind !== "step" || row.empty || !row.role) {
      return null;
    }
    return {
      x: xPad,
      y: meta.y,
      w: width - xPad * 2,
      h: stepRowHeightByIndex.get(rowIndex) ?? stepRowHeight(row, rowIndex)
    };
  }
  const laneIndex = (id) => laneIndexById.get(id) ?? -1;
  const laneX = (i) => laneOffsets[i] ?? xPad + leftGutter;
  const laneWidth = (i) => laneWidths[i] ?? minLaneW;
  const laneCenter = (i) => {
    const lane = lanes[i];
    if (!lane) return laneX(i) + laneWidth(i) / 2;
    const branchMin = stepEdgesByLane.get(lane.id)?.min ?? -nodeW / 2;
    return laneX(i) + laneContentPad - branchMin;
  };
  function caseAnchorX(c) {
    return (c.x ?? width / 2) + (c.offset || 0);
  }
  function findCaseForStep(stepIdx) {
    function searchFrame(frame) {
      for (const c of frame.cases) {
        if (c.rowIndices.includes(stepIdx)) return c;
        if (c.childFrame) {
          const hit = searchFrame(c.childFrame);
          if (hit) return hit;
        }
      }
      return null;
    }
    for (const f of frames) {
      const hit = searchFrame(f);
      if (hit) return hit;
    }
    return null;
  }
  function isStubCase(c, branchId) {
    if (loopAnchorInCase(c.rowIndices, branchId)) return false;
    if (c.childFrame) return false;
    return firstStepIdxInCase(c) == null;
  }
  function frameAnchorX(f) {
    const startIdx = rows.findIndex(
      (r) => r.kind === "branchStart" && r.id === f.id
    );
    if (startIdx > 0) {
      for (let j = startIdx - 1; j >= 0; j--) {
        const row = rows[j];
        if (row.kind === "step" && !row.empty && row.role) {
          return nodeCenterX(j, row.role);
        }
        if (row.kind === "branchCase" && row.depth != null && row.depth < (f.depth ?? 0))
          break;
        if (row.kind === "branchStart" && row.depth < (f.depth ?? 0)) break;
        if (row.kind === "branchEnd") break;
      }
    }
    if (f.parentCase) return caseAnchorX(f.parentCase);
    const first = f.cases[0];
    return first ? caseAnchorX(first) : width / 2;
  }
  function mergeAnchorX(f) {
    if (!mergeAtPreviousBlock) return frameAnchorX(f);
    const endIdx = rows.findIndex(
      (r) => r.kind === "branchEnd" && r.id === f.id
    );
    if (endIdx < 0) return frameAnchorX(f);
    for (let j = endIdx - 1; j >= 0; j--) {
      const row = rows[j];
      if (row.kind === "step" && !row.empty && row.role) {
        return nodeCenterX(j, row.role);
      }
      if (row.kind === "branchEnd" && row.id !== f.id) {
        const nestedFrame = frames.find((fr) => fr.id === row.id);
        if (nestedFrame) return mergeAnchorX(nestedFrame);
      }
      if (row.kind === "branchStart" && row.id === f.id) break;
    }
    return frameAnchorX(f);
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
  function buildCaseFanOutEdgeD(f, c) {
    const dCx = frameAnchorX(f);
    const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
    const dH = 50;
    const mCy = f.yMerge + mergeH / 2;
    const mH = 28;
    const child = c.childFrame;
    const firstStepIdx = firstStepIdxInCase(c);
    const stubCase = isStubCase(c, f.id);
    const targetsNestedDecision = child != null;
    const startX = dCx;
    const startY = dCy + dH / 2;
    const bendY = startY + branchCaseBendYOffset;
    let targetY;
    let targetX = caseAnchorX(c);
    let caseLaneWidth = minLaneW;
    let showArrow = false;
    if (targetsNestedDecision) {
      targetX = frameAnchorX(child);
      targetY = child.yDecision + diamondH / 2 + decisionYOffset - 22;
      const li = laneIndexForX(targetX);
      if (li >= 0) caseLaneWidth = laneWidth(li);
    } else if (firstStepIdx != null) {
      const stepTarget = caseStepLineTarget(firstStepIdx, c);
      if (stepTarget) {
        targetX = stepTarget.x;
        targetY = stepTarget.y;
        showArrow = stepTarget.showArrow;
        const li = laneIndexForX(targetX);
        if (li >= 0) caseLaneWidth = laneWidth(li);
      } else {
        targetY = bendY;
      }
    } else if (stubCase) {
      targetX = caseAnchorX(c);
      targetY = bendY;
    } else {
      targetY = mCy - mH / 2 - 4;
    }
    const sideOffset = c.offset || 0;
    const sideX = targetX;
    const laneSafeMin = targetX - caseLaneWidth / 2 + 16;
    const laneSafeMax = targetX + caseLaneWidth / 2 - 16;
    const clampedSideX = Math.max(
      laneSafeMin,
      Math.min(laneSafeMax, sideX)
    );
    const needsElbow = Math.abs(targetX - startX) > 0.5 || showArrow && sideOffset !== 0;
    return showArrow && sideOffset !== 0 ? `M ${startX} ${startY} L ${startX} ${bendY} L ${clampedSideX} ${bendY} L ${clampedSideX} ${targetY}` : needsElbow ? `M ${startX} ${startY} L ${startX} ${bendY} L ${targetX} ${bendY} L ${targetX} ${targetY}` : `M ${startX} ${startY} L ${targetX} ${targetY}`;
  }
  const stepRows = rows.map((r, i) => ({ r, i, y: rowMeta[i]?.y, meta: rowMeta[i] })).filter((x) => x.r.kind === "step" && !x.r.empty && x.r.role);
  const connectors = [];
  const terminalGap = 28;
  const terminalRadius = 5;
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
    const loopIdx = [...rowIndices].reverse().find(
      (idx) => rows[idx]?.kind === "branchLoop" && rows[idx].loopBranchId === branchId
    );
    if (loopIdx == null) return null;
    const prevStepIdx = [...rowIndices].filter((idx) => idx < loopIdx).reverse().find(
      (idx) => rows[idx]?.kind === "step" && !rows[idx].empty && rows[idx].role
    );
    return { loopIdx, prevStepIdx: prevStepIdx ?? null };
  }
  function applyCaseOffsetsForFrame(frame, inheritedByLane = null) {
    const inherited = inheritedByLane || Object.fromEntries(lanes.map((lane) => [lane.id, 0]));
    const offsets = frameCaseOffsets.get(frame.id);
    const caseLaneOffset = (caseIdx, laneId) => offsets?.get(`${caseIdx}-${laneId}`) || 0;
    frame.cases.forEach((c, caseIdx) => {
      const anchorLane = resolveCaseLane(c);
      c.offset = anchorLane != null ? caseLaneOffset(caseIdx, anchorLane) : 0;
      c.rowIndices.forEach((stepIdx) => {
        const row = rows[stepIdx];
        if (row?.kind === "step" && !row.empty && row.role) {
          stepOffsetByIndex.set(
            stepIdx,
            (inherited[row.role] || 0) + caseLaneOffset(caseIdx, row.role)
          );
        }
      });
      if (c.childFrame) {
        const childInherited = { ...inherited };
        for (const lane of lanes) {
          childInherited[lane.id] = (childInherited[lane.id] || 0) + caseLaneOffset(caseIdx, lane.id);
        }
        applyCaseOffsetsForFrame(c.childFrame, childInherited);
      }
    });
  }
  for (const f of frames) {
    if (!f.parentCase) applyCaseOffsetsForFrame(f, null);
  }
  for (const f of frames) {
    for (const c of f.cases) {
      if (c.childFrame && !caseHasDirectStep(c)) {
        c.x = frameAnchorX(c.childFrame) - (c.offset || 0);
      }
    }
  }
  function nodeCenterX(stepIdx, roleId) {
    const li = laneIndex(roleId);
    if (li < 0) return width / 2;
    const baseX = laneCenter(li);
    const offset = stepOffsetByIndex.get(stepIdx) || 0;
    return baseX + offset;
  }
  function stepObstacleBounds(rowIndex) {
    const row = rows[rowIndex];
    const cx = row?.role && laneIndex(row.role) >= 0 ? nodeCenterX(rowIndex, row.role) : width / 2;
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
  function buildLoopBackPath({
    fromX,
    fromBottomY,
    dCx,
    dCy,
    dW,
    frame,
    sourceStepIdx,
    caseOffset
  }) {
    const startY = fromBottomY;
    const sourceBounds = sourceStepIdx != null ? stepObstacleBounds(sourceStepIdx) : null;
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
    const extentLeft = obstacles.length ? Math.min(...obstacles.map((o) => o.left)) : sourceBounds?.left ?? fromX - nodeW / 2;
    const extentRight = obstacles.length ? Math.max(...obstacles.map((o) => o.right)) : sourceBounds?.right ?? fromX + nodeW / 2;
    let routeX;
    if (sideSign < 0) {
      routeX = Math.min(extentLeft, fromX, dCx - dW / 2) - loopRouteMargin;
    } else {
      routeX = Math.max(extentRight, fromX, dCx + dW / 2) + loopRouteMargin;
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
  function renderPropDocChip(prop, x, y2) {
    const fill = prop.bg || theme.bg;
    const strokeCol = prop.borderColor || theme.stroke;
    const labelColor = prop.textColor || theme.title;
    const maxLen = typeof prop.maxChars === "number" && prop.maxChars > 0 ? prop.maxChars : 9;
    const tip = prop.title || prop.label || prop.id;
    return /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h("title", null, tip), /* @__PURE__ */ h(
      "path",
      {
        d: `M ${x} ${y2} H ${x + docW - 8} L ${x + docW} ${y2 + 8} V ${y2 + docH} H ${x} Z`,
        fill,
        stroke: strokeCol,
        strokeWidth: "1.1"
      }
    ), /* @__PURE__ */ h(
      "path",
      {
        d: `M ${x + docW - 8} ${y2} V ${y2 + 8} H ${x + docW}`,
        fill: "none",
        stroke: strokeCol,
        strokeWidth: "1"
      }
    ), /* @__PURE__ */ h(
      "text",
      {
        x: x + docW / 2 - 2,
        y: y2 + 12,
        textAnchor: "middle",
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: "9",
        fill: labelColor
      },
      truncate(prop.label || prop.id, maxLen)
    ));
  }
  for (let i = 1; i < stepRows.length; i++) {
    const prev = stepRows[i - 1];
    const cur = stepRows[i];
    const prevCase = caseOfStep(prev.i);
    const curCase = caseOfStep(cur.i);
    if (prevCase && curCase && (prevCase.frame !== curCase.frame || prevCase.caseIdx !== curCase.caseIdx))
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
      key: `c-${i}`
    });
  }
  const frameById = new Map(frames.map((f) => [f.id, f]));
  function startTerminalAnchor() {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.kind === "step" && !row.empty && row.role) {
        if (laneIndex(row.role) < 0) return null;
        return { x: nodeCenterX(i, row.role), targetY: stepBlockCenterY(i) - 22 };
      }
      if (row.kind === "branchStart") {
        const frame = frameById.get(row.id);
        if (!frame) continue;
        return {
          x: frameAnchorX(frame),
          targetY: frame.yDecision + diamondH / 2 + decisionYOffset - 25
        };
      }
    }
    return null;
  }
  function endTerminalAnchor() {
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i];
      if (row.kind === "step" && !row.empty && row.role) {
        return {
          x: nodeCenterX(i, row.role),
          sourceY: stepBlockCenterY(i) + 22
        };
      }
      if (row.kind === "branchEnd") {
        const frame = frameById.get(row.id);
        if (!frame) continue;
        const mergeCenterX = mergeAnchorX(frame);
        const mergeBottomY = frame.yMerge + mergeH / 2 + 14;
        return {
          x: mergeCenterX,
          sourceY: mergeBottomY
        };
      }
    }
    return null;
  }
  const firstAnchor = startTerminalAnchor();
  const lastAnchor = endTerminalAnchor();
  const hasEndTerminal = Boolean(lastAnchor);
  const startTerminal = firstAnchor ? {
    x: firstAnchor.x,
    y: firstAnchor.targetY - terminalGap,
    targetY: firstAnchor.targetY
  } : null;
  const endTerminal = hasEndTerminal && lastAnchor ? {
    x: lastAnchor.x,
    y: lastAnchor.sourceY + terminalGap,
    sourceY: lastAnchor.sourceY
  } : null;
  const endTerminalBottom = endTerminal ? endTerminal.y + terminalRadius + 16 : 0;
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
        const meta2 = rowMeta[i];
        if (meta2 != null) stepRowDividerYs.push(meta2.y + mergeH);
        return;
      }
      if (row.kind === "step" && row.empty) {
        const meta2 = rowMeta[i];
        if (meta2 == null) return;
        const next2 = rows[i + 1];
        let yLine2 = meta2.y + (stepRowHeightByIndex.get(i) ?? rowH);
        if (next2?.kind === "branchStart") {
          const branchMeta = rowMeta[i + 1];
          if (branchMeta != null) yLine2 = branchMeta.y + diamondH;
        }
        if (next2?.kind === "branchLoop") {
          const loopMeta = rowMeta[i + 1];
          if (loopMeta != null) yLine2 = loopMeta.y + branchLoopH;
        }
        stepRowDividerYs.push(yLine2);
        return;
      }
      if (row.kind !== "step" || !row.role) return;
      if (i === lastStepRowIndex && rows[i + 1]?.kind !== "branchLoop") return;
      const meta = rowMeta[i];
      if (meta == null) return;
      const next = rows[i + 1];
      let yLine = meta.y + (stepRowHeightByIndex.get(i) ?? stepRowHeight(row, i));
      if (next?.kind === "step" && next.skipIndex) return;
      if (next?.kind === "branchStart") {
        const branchMeta = rowMeta[i + 1];
        if (branchMeta != null) yLine = branchMeta.y + diamondH;
      }
      if (next?.kind === "branchLoop") {
        const loopMeta = rowMeta[i + 1];
        if (loopMeta != null) yLine = loopMeta.y + branchLoopH;
      }
      stepRowDividerYs.push(yLine);
    });
  }
  const swimlaneDividerX1 = xPad;
  const swimlaneDividerX2 = lanes.length > 0 ? laneX(lanes.length - 1) + laneWidth(lanes.length - 1) : 0;
  return /* @__PURE__ */ h(
    "svg",
    {
      viewBox: `0 0 ${width} ${height}`,
      xmlns: "http://www.w3.org/2000/svg",
      style: {
        width: "100%",
        height: "auto",
        background: theme.bg,
        display: "block"
      },
      id: "swimlane-svg"
    },
    /* @__PURE__ */ h("defs", null, /* @__PURE__ */ h(
      "marker",
      {
        id: "arrowhead",
        viewBox: "0 0 10 10",
        refX: "9",
        refY: "5",
        markerWidth: "7",
        markerHeight: "7",
        orient: "auto-start-reverse"
      },
      /* @__PURE__ */ h("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: theme.stroke })
    ), /* @__PURE__ */ h(
      "pattern",
      {
        id: "gridp",
        width: "24",
        height: "24",
        patternUnits: "userSpaceOnUse"
      },
      /* @__PURE__ */ h(
        "path",
        {
          d: "M 24 0 L 0 0 0 24",
          fill: "none",
          stroke: theme.grid,
          strokeWidth: "0.5"
        }
      )
    )),
    hasPageHeader && pageHeaderY != null && /* @__PURE__ */ h(
      PageTriColumnText,
      {
        y: pageHeaderY,
        width,
        xPad,
        left: page.headerLeft,
        center: page.headerCenter,
        right: page.headerRight,
        fill: theme.laneText || theme.title,
        fontSize: 11
      }
    ),
    title && titleY != null && /* @__PURE__ */ h(
      "text",
      {
        x: width / 2,
        y: titleY,
        textAnchor: "middle",
        fill: theme.title,
        fontFamily: "'Shippori Mincho','Noto Serif JP',Georgia,serif",
        fontSize: "24",
        fontWeight: "600",
        letterSpacing: "0.05em"
      },
      title
    ),
    pageDescLines.length > 0 && pageDescStartY != null && /* @__PURE__ */ h(
      "text",
      {
        x: width / 2,
        y: pageDescStartY,
        textAnchor: "middle",
        fill: theme.laneText || theme.title,
        fontFamily: "'Shippori Mincho','Noto Serif JP',Georgia,serif",
        fontSize: "13"
      },
      pageDescLines.map((line, i) => /* @__PURE__ */ h("tspan", { key: i, x: width / 2, dy: i === 0 ? 0 : pageDescLineHeight }, line))
    ),
    /* @__PURE__ */ h(
      "rect",
      {
        width,
        height,
        fill: "url(#gridp)",
        opacity: "0.5"
      }
    ),
    /* @__PURE__ */ h(
      "rect",
      {
        x: xPad,
        y: topPad,
        width: leftGutter,
        height: headerH,
        fill: "white",
        opacity: "0.9"
      }
    ),
    /* @__PURE__ */ h(
      "line",
      {
        x1: xPad,
        x2: xPad + leftGutter,
        y1: topPad + headerH,
        y2: topPad + headerH,
        stroke: theme.stroke,
        strokeWidth: "1.2",
        vectorEffect: "non-scaling-stroke"
      }
    ),
    /* @__PURE__ */ h(
      "rect",
      {
        x: xPad,
        y: headerH,
        width: leftGutter,
        height: leftGutterBodyH,
        fill: "none",
        stroke: theme.stroke,
        strokeWidth: "1.2"
      }
    ),
    rows.map((r, i) => {
      if (r.kind !== "step" || r.empty || !r.role) return null;
      if (r.skipIndex) return null;
      const yRow = rowMeta[i]?.y;
      if (yRow == null) return null;
      const d = stepRowDisplay.get(i);
      const titleText = (r.name || r.text || "").trim();
      const hasNum = d && !d.skipped && d.displayIndex != null;
      const prefix = hasNum ? `${d.displayIndex}. ` : "";
      if (!titleText && !r.description) return null;
      return /* @__PURE__ */ h("g", { key: `step-left-${i}` }, titleText && /* @__PURE__ */ h(
        "text",
        {
          x: 12 + xPad,
          y: yRow + 30,
          fill: theme.title,
          fontFamily: "'Noto Sans JP',sans-serif",
          fontSize: "12",
          fontWeight: "600"
        },
        prefix,
        truncate(titleText, 28)
      ), r.description?.trim() && (() => {
        const visualLines = wrapDescriptionToVisualLines(
          r.description.trim(),
          28
        );
        const descY = titleText ? yRow + 50 : yRow + 30;
        const descX = 12 + xPad;
        return /* @__PURE__ */ h(
          "text",
          {
            x: descX,
            y: descY,
            fill: theme.laneText || theme.title,
            opacity: "0.78",
            fontFamily: "'Noto Sans JP',sans-serif",
            fontSize: "10",
            fontWeight: "400"
          },
          visualLines.map((runs, li) => /* @__PURE__ */ h(
            "tspan",
            {
              key: li,
              x: descX,
              dy: li === 0 ? 0 : descriptionLineHeight
            },
            runs.map((run, ri) => /* @__PURE__ */ h(
              "tspan",
              {
                key: ri,
                fontWeight: run.bold ? "600" : "400",
                fontStyle: run.italic ? "italic" : "normal",
                textDecoration: run.strike ? "line-through" : "none"
              },
              run.text
            ))
          ))
        );
      })());
    }),
    lanes.map((lane, i) => {
      const x = laneX(i);
      const currentLaneW = laneWidth(i);
      const bg = lane.bg || theme.laneFills[i % theme.laneFills.length];
      const txt = lane.textColor || theme.laneText;
      return /* @__PURE__ */ h("g", { key: `lane-${i}` }, /* @__PURE__ */ h(
        "rect",
        {
          x,
          y: topPad,
          width: currentLaneW,
          height: height - topPad - 20,
          fill: bg,
          opacity: "0.12"
        }
      ), /* @__PURE__ */ h(
        "rect",
        {
          x,
          y: topPad,
          width: currentLaneW,
          height: headerH,
          fill: bg,
          opacity: "0.9"
        }
      ), lane.icon && /* @__PURE__ */ h("g", null, /* @__PURE__ */ h(
        "circle",
        {
          cx: x + 28,
          cy: topPad + headerH / 2,
          r: "16",
          fill: theme.bg,
          stroke: txt,
          strokeWidth: "1.2"
        }
      ), /* @__PURE__ */ h(
        BlockIcon,
        {
          icon: lane.icon,
          x: x + 12,
          y: topPad + headerH / 2,
          size: 22,
          color: txt,
          shape: "rounded"
        }
      )), /* @__PURE__ */ h(
        "text",
        {
          x: lane.icon ? x + 54 : x + currentLaneW / 2,
          y: topPad + headerH / 2 + 6,
          textAnchor: lane.icon ? "start" : "middle",
          fill: txt,
          fontFamily: "'Noto Sans JP',sans-serif",
          fontSize: "15",
          fontWeight: "700",
          letterSpacing: "0.06em"
        },
        lane.label
      ), /* @__PURE__ */ h(
        "line",
        {
          style: { color: "red" },
          x1: x,
          x2: x + currentLaneW,
          y1: topPad + headerH,
          y2: topPad + headerH,
          stroke: theme.stroke,
          strokeWidth: "1.2",
          vectorEffect: "non-scaling-stroke"
        }
      ));
    }),
    stepRowDividerYs.map((yLine, di) => /* @__PURE__ */ h(
      "line",
      {
        key: `step-row-div-${di}`,
        x1: swimlaneDividerX1,
        y1: yLine,
        x2: swimlaneDividerX2,
        y2: yLine,
        stroke: theme.grid,
        strokeWidth: "1",
        vectorEffect: "non-scaling-stroke",
        opacity: "0.95"
      }
    )),
    lanes.map((lane, i) => /* @__PURE__ */ h(
      "rect",
      {
        key: `lane-debug-outline-${lane.id ?? i}`,
        x: laneX(i),
        y: topPad,
        width: laneWidth(i),
        height: height - topPad - 20,
        fill: "none",
        stroke: theme.stroke,
        strokeWidth: "1.2"
      }
    )),
    frames.map((f) => {
      if (f.yMerge == null) return null;
      const dCx = frameAnchorX(f);
      const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
      const dW = Math.max(140, (f.cond.length + 4) * 9);
      const dH = 50;
      const decisionStyle = resolveBranchStyle(f.decisionColor);
      const mCx = mergeAnchorX(f);
      const mCy = f.yMerge + mergeH / 2;
      const mW = 40;
      const mH = 28;
      const diamondPath = (cx, cy, w, h2) => `M ${cx} ${cy - h2 / 2} L ${cx + w / 2} ${cy} L ${cx} ${cy + h2 / 2} L ${cx - w / 2} ${cy} Z`;
      return /* @__PURE__ */ h("g", { key: `branch-${f.id}` }, /* @__PURE__ */ h(
        "path",
        {
          d: diamondPath(dCx, dCy, dW, dH),
          fill: theme.branchBg,
          stroke: theme.branch,
          strokeWidth: "1.8"
        }
      ), /* @__PURE__ */ h(
        "text",
        {
          x: dCx,
          y: dCy + 4,
          textAnchor: "middle",
          fontFamily: "'Noto Sans JP',sans-serif",
          fontSize: "13",
          fontWeight: "600",
          fill: theme.branch
        },
        truncate(f.cond, 16)
      ), f.cases.map((c, ci) => {
        const edgeD = buildCaseFanOutEdgeD(f, c);
        const firstStepIdx = firstStepIdxInCase(c);
        const showArrow = firstStepIdx != null && caseStepLineTarget(firstStepIdx, c)?.showArrow;
        return /* @__PURE__ */ h("g", { key: `case-${f.id}-${ci}` }, /* @__PURE__ */ h(
          "path",
          {
            d: edgeD,
            fill: "none",
            stroke: theme.stroke,
            strokeWidth: "1.6",
            markerEnd: showArrow ? "url(#arrowhead)" : void 0
          }
        ));
      }), f.cases.map((c, ci) => {
        const stubCase = isStubCase(c, f.id);
        const startY = dCy + dH / 2;
        const caseRailY = startY + branchCaseBendYOffset;
        const anchor = loopAnchorInCase(c.rowIndices, f.id);
        if (anchor) {
          let fromX2;
          let fromBottomY;
          let sourceStepIdx = null;
          if (anchor.prevStepIdx != null) {
            sourceStepIdx = anchor.prevStepIdx;
            const r = rows[anchor.prevStepIdx];
            const li = laneIndex(r.role);
            fromX2 = li >= 0 ? nodeCenterX(anchor.prevStepIdx, r.role) : c.x;
            fromBottomY = stepBlockBottomY(anchor.prevStepIdx);
          } else {
            fromX2 = c.x;
            const loopY = rowMeta[anchor.loopIdx]?.y ?? f.yDecision;
            fromBottomY = loopY + (stepRowHeightByIndex.get(anchor.loopIdx) || branchLoopH);
          }
          const d2 = buildLoopBackPath({
            fromX: fromX2,
            fromBottomY,
            dCx,
            dCy,
            dW,
            frame: f,
            sourceStepIdx,
            caseOffset: c.offset || 0
          });
          return /* @__PURE__ */ h(
            "path",
            {
              key: `loop-${f.id}-${ci}`,
              d: d2,
              fill: "none",
              stroke: theme.stroke,
              strokeWidth: "1.6",
              markerEnd: "url(#arrowhead)"
            }
          );
        }
        const mergeFrom = caseMergeAnchor(c);
        let fromX;
        let fromY;
        if (stubCase) {
          fromX = caseAnchorX(c);
          fromY = caseRailY;
        } else if (mergeFrom) {
          fromX = mergeFrom.fromX;
          fromY = mergeFrom.fromY;
        } else {
          const lastStepIdx = lastStepIdxInCase(c);
          const stepSource = lastStepIdx != null ? caseStepLineSource(lastStepIdx, c) : null;
          if (stepSource) {
            fromX = stepSource.x;
            fromY = stepSource.y;
          } else {
            fromX = caseAnchorX(c);
            fromY = caseRailY;
          }
        }
        const toX = mCx;
        const toY = mCy - mH / 2;
        const bendY2 = toY - 14;
        const sideOffset = c.offset || 0;
        const needsMergeElbow = Math.abs(fromX - toX) > 0.5 || sideOffset !== 0 || stubCase;
        const d = needsMergeElbow ? `M ${fromX} ${fromY} L ${fromX} ${bendY2} L ${toX} ${bendY2} L ${toX} ${toY}` : `M ${fromX} ${fromY} L ${toX} ${toY}`;
        return /* @__PURE__ */ h(
          "path",
          {
            key: `mrg-${f.id}-${ci}`,
            d,
            fill: "none",
            stroke: theme.stroke,
            strokeWidth: "1.6"
          }
        );
      }), f.cases.map((c, ci) => {
        const child = c.childFrame;
        const afterIdx = firstDirectStepAfterChild(c);
        if (child?.yMerge == null || afterIdx == null) return null;
        const stepTarget = caseStepLineTarget(afterIdx, c);
        if (!stepTarget) return null;
        const fromX = mergeAnchorX(child);
        const fromY = child.yMerge + mergeH / 2 + 14;
        const toX = stepTarget.x;
        const toY = stepTarget.y;
        const mid = (fromY + toY) / 2;
        const d = Math.abs(fromX - toX) < 0.5 ? `M ${fromX} ${fromY} L ${toX} ${toY}` : `M ${fromX} ${fromY} L ${fromX} ${mid} L ${toX} ${mid} L ${toX} ${toY}`;
        return /* @__PURE__ */ h(
          "path",
          {
            key: `nested-out-${f.id}-${ci}`,
            d,
            fill: "none",
            stroke: theme.stroke,
            strokeWidth: "1.6",
            markerEnd: "url(#arrowhead)"
          }
        );
      }), /* @__PURE__ */ h(
        "path",
        {
          d: diamondPath(mCx, mCy, mW, mH),
          fill: theme.branchBg,
          stroke: theme.branch,
          strokeWidth: "1.6"
        }
      ));
    }),
    connectors.map((c) => {
      if (Math.abs(c.fromX - c.toX) < 0.5) {
        const x = c.fromX;
        return /* @__PURE__ */ h(
          "line",
          {
            key: c.key,
            x1: x,
            y1: c.y1,
            x2: x,
            y2: c.y2,
            stroke: theme.stroke,
            strokeWidth: "1.6",
            markerEnd: "url(#arrowhead)"
          }
        );
      }
      const x1 = c.fromX;
      const x2 = c.toX;
      const mid = (c.y1 + c.y2) / 2;
      const d = `M ${x1} ${c.y1} L ${x1} ${mid} L ${x2} ${mid} L ${x2} ${c.y2}`;
      return /* @__PURE__ */ h(
        "path",
        {
          key: c.key,
          d,
          fill: "none",
          stroke: theme.stroke,
          strokeWidth: "1.6",
          markerEnd: "url(#arrowhead)"
        }
      );
    }),
    startTerminal && /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(
      "line",
      {
        x1: startTerminal.x,
        y1: startTerminal.y + terminalRadius,
        x2: startTerminal.x,
        y2: startTerminal.targetY,
        stroke: theme.stroke,
        strokeWidth: "1.6",
        markerEnd: "url(#arrowhead)"
      }
    ), /* @__PURE__ */ h(
      "circle",
      {
        cx: startTerminal.x,
        cy: startTerminal.y,
        r: terminalRadius,
        fill: theme.stroke
      }
    )),
    endTerminal && /* @__PURE__ */ h(Fragment, null, /* @__PURE__ */ h(
      "line",
      {
        x1: endTerminal.x,
        y1: endTerminal.sourceY,
        x2: endTerminal.x,
        y2: endTerminal.y - terminalRadius,
        stroke: theme.stroke,
        strokeWidth: "1.6",
        markerEnd: "url(#arrowhead)"
      }
    ), /* @__PURE__ */ h(
      "circle",
      {
        cx: endTerminal.x,
        cy: endTerminal.y,
        r: terminalRadius,
        fill: theme.stroke
      }
    )),
    rows.map((r, i) => {
      const yRow = rowMeta[i]?.y;
      if (yRow == null || r.kind !== "step") return null;
      if (r.empty) {
        const emptyCase = findCaseForStep(i);
        const cx2 = emptyCase ? caseAnchorX(emptyCase) : width / 2;
        return /* @__PURE__ */ h(
          "circle",
          {
            key: `step-${i}`,
            cx: cx2,
            cy: stepBlockCenterY(i),
            r: "5",
            fill: theme.stroke,
            opacity: "0.35"
          }
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
      const fill = block && block.bg || lane.bg || theme.boxBg;
      const txtColor = block && block.textColor || lane.textColor || theme.boxText;
      const stroke = block && block.borderColor || theme.stroke;
      const shape = block && block.shape || "rounded";
      const blockIcon = block && block.icon;
      const { left: leftProps, right: rightProps } = splitPropsBySide(r.props);
      const docY = cy + boxH / 2 - 8;
      return /* @__PURE__ */ h("g", { key: `step-${i}` }, /* @__PURE__ */ h(
        StepShape,
        {
          shape,
          cx,
          cy,
          w: boxW,
          h: boxH,
          fill,
          stroke
        }
      ), blockIcon && /* @__PURE__ */ h(
        BlockIcon,
        {
          icon: blockIcon,
          x: cx - boxW / 2,
          y: cy,
          size: 16,
          color: txtColor,
          shape
        }
      ), /* @__PURE__ */ h(
        "text",
        {
          x: blockIcon ? cx + 8 : cx,
          y: cy + 5,
          textAnchor: "middle",
          fill: txtColor,
          fontFamily: "'Noto Sans JP',sans-serif",
          fontSize: "13",
          fontWeight: "500"
        },
        truncate(r.text, blockIcon ? 18 : 22)
      ), showStepBlockCaptions && r.blockRef && /* @__PURE__ */ h(
        "text",
        {
          "data-export-caption": "block-ref",
          x: cx + boxW / 2 - 4,
          y: cy - boxH / 2 - 5,
          textAnchor: "end",
          fontSize: "8",
          fontFamily: "'JetBrains Mono',monospace",
          opacity: "0.45"
        },
        r.blockRef
      ), showStepBlockCaptions && shape && /* @__PURE__ */ h(
        "text",
        {
          "data-export-caption": "shape",
          x: cx - boxW / 2 + 4,
          y: cy - boxH / 2 - 5,
          textAnchor: "start",
          fontSize: "8",
          fontFamily: "'JetBrains Mono',monospace",
          opacity: "0.45"
        },
        shape.toUpperCase()
      ), [...leftProps].reverse().map((prop, docIdx) => {
        const x = cx - boxW / 2 + 55 - docW + docIdx * docGapX;
        const y2 = docY + docIdx * docGapY;
        return /* @__PURE__ */ h("g", { key: `prop-left-${i}-${prop.id}` }, renderPropDocChip(prop, x, y2));
      }), rightProps.map((prop, docIdx) => {
        const x = cx + boxW / 2 - 60 + docIdx * docGapX;
        const y2 = docY + docIdx * docGapY;
        return /* @__PURE__ */ h("g", { key: `prop-right-${i}-${prop.id}` }, renderPropDocChip(prop, x, y2));
      }));
    }),
    frames.map((f) => {
      if (f.yMerge == null) return null;
      const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
      const dH = 50;
      return f.cases.map((c, ci) => {
        if (/^else$/i.test((c.label || "").trim())) return null;
        const firstStepIdx = firstStepIdxInCase(c);
        let targetY;
        let targetX = c.x;
        if (firstStepIdx != null) {
          const stepTarget = caseStepLineTarget(firstStepIdx, c);
          if (stepTarget) {
            targetX = stepTarget.x;
            targetY = stepTarget.y;
          } else {
            targetY = stepBlockCenterY(firstStepIdx) - 22;
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
        return /* @__PURE__ */ h("g", { key: `case-label-overlay-${f.id}-${ci}` }, /* @__PURE__ */ h(
          "rect",
          {
            x: labelX - labelW / 2,
            y: labelY - 11,
            width: labelW,
            height: 20,
            rx: "3",
            fill: caseStyle.bg,
            fillOpacity: "0.8",
            stroke: caseStyle.stroke,
            strokeWidth: "0.9"
          }
        ), /* @__PURE__ */ h(
          "text",
          {
            x: labelX,
            y: labelY + 4,
            textAnchor: "middle",
            fontSize: "11",
            fontWeight: "600",
            fontFamily: "'Noto Sans JP',sans-serif",
            fill: caseStyle.stroke
          },
          c.label
        ));
      });
    }),
    frames.map((f) => {
      const startIdx = rows.findIndex(
        (r) => r.kind === "branchStart" && r.id === f.id
      );
      if (startIdx < 0) return null;
      let prevStepIdx = -1;
      for (let j = startIdx - 1; j >= 0; j--) {
        const row = rows[j];
        if (row.kind === "step" && !row.empty && row.role) {
          prevStepIdx = j;
          break;
        }
        if (row.kind === "branchCase" && (row.id === f.id || row.depth != null && row.depth < f.depth))
          break;
        if (row.kind === "branchStart" && row.depth < f.depth) break;
        if (row.kind === "branchEnd") break;
      }
      const endIdx = rows.findIndex(
        (r) => r.kind === "branchEnd" && r.id === f.id
      );
      if (endIdx < 0) return null;
      const nextStepIdx = findNextFlowStepAfterBranchEnd(
        rows,
        startIdx,
        endIdx
      );
      const nextBranchStartIdx = findNextSiblingBranchStart(
        rows,
        startIdx,
        endIdx
      );
      const dCx = frameAnchorX(f);
      const dTopY = f.yDecision + diamondH / 2 + decisionYOffset - 25;
      const mCx = mergeAnchorX(f);
      const mBotY = f.yMerge + mergeH / 2 + 14;
      const edges = [];
      if (prevStepIdx >= 0) {
        const r = rows[prevStepIdx];
        const li = laneIndex(r.role);
        const sx = li >= 0 ? nodeCenterX(prevStepIdx, r.role) : dCx;
        const sy = stepBlockCenterY(prevStepIdx) + 22;
        const bend = (sy + dTopY) / 2;
        const d = sx === dCx ? `M ${sx} ${sy} L ${dCx} ${dTopY}` : `M ${sx} ${sy} L ${sx} ${bend} L ${dCx} ${bend} L ${dCx} ${dTopY}`;
        edges.push(
          /* @__PURE__ */ h(
            "path",
            {
              key: `in-${f.id}`,
              d,
              fill: "none",
              stroke: theme.stroke,
              strokeWidth: "1.6",
              markerEnd: "url(#arrowhead)"
            }
          )
        );
      }
      if (nextStepIdx >= 0) {
        const r = rows[nextStepIdx];
        const li = laneIndex(r.role);
        const tx = li >= 0 ? nodeCenterX(nextStepIdx, r.role) : mCx;
        const ty = stepBlockCenterY(nextStepIdx) - 22;
        const bend = (mBotY + ty) / 2;
        const d = tx === mCx ? `M ${mCx} ${mBotY} L ${tx} ${ty}` : `M ${mCx} ${mBotY} L ${mCx} ${bend} L ${tx} ${bend} L ${tx} ${ty}`;
        edges.push(
          /* @__PURE__ */ h(
            "path",
            {
              key: `out-${f.id}`,
              d,
              fill: "none",
              stroke: theme.stroke,
              strokeWidth: "1.6",
              markerEnd: "url(#arrowhead)"
            }
          )
        );
      } else if (nextBranchStartIdx >= 0) {
        const nextFrame = frameById.get(rows[nextBranchStartIdx].id);
        const nextRowY = rowMeta[nextBranchStartIdx]?.y;
        if (nextFrame && nextRowY != null) {
          const nextCx = frameAnchorX(nextFrame);
          const nextTopY = nextRowY + diamondH / 2 + decisionYOffset - 25;
          const bend = (mBotY + nextTopY) / 2;
          const d = Math.abs(nextCx - mCx) < 0.5 ? `M ${mCx} ${mBotY} L ${nextCx} ${nextTopY}` : `M ${mCx} ${mBotY} L ${mCx} ${bend} L ${nextCx} ${bend} L ${nextCx} ${nextTopY}`;
          edges.push(
            /* @__PURE__ */ h(
              "path",
              {
                key: `out-if-${f.id}-${rows[nextBranchStartIdx].id}`,
                d,
                fill: "none",
                stroke: theme.stroke,
                strokeWidth: "1.6",
                markerEnd: "url(#arrowhead)"
              }
            )
          );
        }
      }
      return edges.length > 0 ? /* @__PURE__ */ h("g", { key: `io-${f.id}` }, edges) : null;
    }),
    interactive && selectedRowIndex != null && (() => {
      const bounds = stepRowBounds(selectedRowIndex);
      if (!bounds) return null;
      return /* @__PURE__ */ h(
        RowSelectionHighlight,
        {
          key: `sel-${selectedRowIndex}`,
          x: bounds.x,
          y: bounds.y,
          w: bounds.w,
          h: bounds.h
        }
      );
    })(),
    interactive && rows.map((r, i) => {
      const meta = rowMeta[i];
      if (!meta) return null;
      if (r.kind === "step" && !r.empty && r.role) {
        const bounds = stepRowBounds(i);
        if (!bounds) return null;
        return /* @__PURE__ */ h(
          RowHitTarget,
          {
            key: `hit-${i}`,
            rowIndex: i,
            x: bounds.x,
            y: bounds.y,
            w: bounds.w,
            h: bounds.h,
            selected: false,
            onSelect: onRowSelect
          }
        );
      }
      if (r.kind === "branchStart") {
        const f = frames.find((fr) => fr.id === r.id);
        if (!f) return null;
        const dCx = frameAnchorX(f);
        const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
        const dW = Math.max(140, (f.cond.length + 4) * 9);
        const dH = 50;
        return /* @__PURE__ */ h(
          RowHitTarget,
          {
            key: `hit-${i}`,
            rowIndex: i,
            x: dCx - dW / 2 - 12,
            y: dCy - dH / 2 - 12,
            w: dW + 24,
            h: dH + 24,
            selected: selectedRowIndex === i,
            onSelect: onRowSelect
          }
        );
      }
      if (r.kind === "branchCase") {
        const f = frames.find(
          (fr) => fr.cases.some((c2) => c2.startRow === i)
        );
        const c = f?.cases.find((ca) => ca.startRow === i);
        if (!f || !c) return null;
        const labelW = ((c.label || "").length + 2) * 8.5;
        const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
        const dH = 50;
        const startY = dCy + dH / 2;
        const bendY = startY + branchCaseBendYOffset;
        const labelY = bendY + 18;
        let targetX = c.x;
        const firstStepIdx = firstStepIdxInCase(c);
        if (firstStepIdx != null) {
          const stepTarget = caseStepLineTarget(firstStepIdx, c);
          if (stepTarget) targetX = stepTarget.x;
        }
        const edgeD = buildCaseFanOutEdgeD(f, c);
        return /* @__PURE__ */ h("g", { key: `hit-${i}` }, /* @__PURE__ */ h(
          PathHitTarget,
          {
            rowIndex: i,
            d: edgeD,
            onSelect: onRowSelect
          }
        ), /* @__PURE__ */ h(
          RowHitTarget,
          {
            rowIndex: i,
            x: targetX - labelW / 2 - 8,
            y: labelY - 14,
            w: labelW + 16,
            h: 28,
            selected: selectedRowIndex === i,
            onSelect: onRowSelect
          }
        ));
      }
      if (r.kind === "branchEnd") {
        const f = frames.find((fr) => fr.endRow === i);
        if (!f || f.yMerge == null) return null;
        const mCx = mergeAnchorX(f);
        const mCy = f.yMerge + mergeH / 2;
        const mW = 40;
        const mH = 28;
        return /* @__PURE__ */ h(
          RowHitTarget,
          {
            key: `hit-${i}`,
            rowIndex: i,
            x: mCx - mW / 2 - 10,
            y: mCy - mH / 2 - 10,
            w: mW + 20,
            h: mH + 20,
            selected: selectedRowIndex === i,
            onSelect: onRowSelect
          }
        );
      }
      if (r.kind === "branchLoop") {
        const yRow = meta.y ?? 0;
        return /* @__PURE__ */ h(
          RowHitTarget,
          {
            key: `hit-${i}`,
            rowIndex: i,
            x: xPad + leftGutter,
            y: yRow,
            w: width - xPad * 2 - leftGutter,
            h: branchLoopH,
            selected: selectedRowIndex === i,
            onSelect: onRowSelect
          }
        );
      }
      return null;
    }),
    hasPageFooter && /* @__PURE__ */ h(
      PageTriColumnText,
      {
        y: height - 12,
        width,
        xPad,
        left: page.footerLeft,
        center: page.footerCenter,
        right: page.footerRight,
        fill: theme.laneText || theme.title,
        fontSize: 11
      }
    )
  );
}
export {
  BRANCH_COLOR_STYLES,
  renderDiagramSvg
};
