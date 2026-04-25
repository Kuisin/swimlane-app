import { truncate } from "../../lib/utils";
import { StepShape } from "./step-shape";
import { BlockIcon } from "./block-icon";

export function Diagram({ model, theme }) {
  const { title, lanes, rows, blocks = {} } = model;
  const minLaneW = 220;
  const maxLaneW = 360;
  const nodeW = 188;
  const sidePad = 40;
  const topPad = title ? 72 : 32;
  const headerH = 72;
  const rowH = 80;
  const diamondH = 90;
  const mergeH = 60;
  const decisionYOffset = -15;
  const branchCaseBendYOffset = 10;

  const rowMeta = [];
  let y = topPad + headerH + 24;
  const frames = [];
  const frameStack = [];
  const laneIndexById = new Map(lanes.map((lane, idx) => [lane.id, idx]));

  function estimateTextWidth(text, base = 28) {
    if (!text) return base;
    let width = base;
    for (const ch of text) width += /[ -~]/.test(ch) ? 8 : 14;
    return width;
  }

  rows.forEach((r, i) => {
    if (r.kind === "branchStart") {
      const f = {
        id: r.id,
        depth: r.depth,
        cond: r.cond,
        yDecision: y,
        cases: [{ label: r.firstCase, rowIndices: [] }],
      };
      frameStack.push(f);
      frames.push(f);
      rowMeta[i] = { y, kind: "decision" };
      y += diamondH;
    } else if (r.kind === "branchCase") {
      const f = frameStack[frameStack.length - 1];
      if (f) f.cases.push({ label: r.label, rowIndices: [] });
      rowMeta[i] = { y, kind: "case" };
    } else if (r.kind === "branchEnd") {
      const f = frameStack.pop();
      if (f) f.yMerge = y;
      rowMeta[i] = { y, kind: "merge" };
      y += mergeH;
    } else if (r.kind === "step") {
      rowMeta[i] = { y, kind: "step" };
      frameStack.forEach((frame) => {
        const lastCase = frame.cases[frame.cases.length - 1];
        if (lastCase) lastCase.rowIndices.push(i);
      });
      y += rowH;
    }
  });

  const caseSpread = 70;
  const maxCasesPerLane = new Map();
  frames.forEach((f) => {
    const counts = new Map();
    f.cases.forEach((c) => {
      const firstStep = c.rowIndices.find((stepIdx) => {
        const row = rows[stepIdx];
        return row.kind === "step" && !row.empty && row.role;
      });
      if (firstStep == null) return;
      const laneId = rows[firstStep].role;
      counts.set(laneId, (counts.get(laneId) || 0) + 1);
    });
    counts.forEach((count, laneId) => {
      const prev = maxCasesPerLane.get(laneId) || 0;
      maxCasesPerLane.set(laneId, Math.max(prev, count));
    });
  });

  const laneWidths = lanes.map((lane) => {
    const headerWidth = estimateTextWidth(lane.label || lane.id, lane.icon ? 88 : 64);
    const maxStepWidth = rows.reduce((maxWidth, row) => {
      if (row.kind !== "step" || row.role !== lane.id || row.empty) return maxWidth;
      const stepWidth = estimateTextWidth(row.text, 68);
      return Math.max(maxWidth, stepWidth);
    }, 0);
    const caseCount = maxCasesPerLane.get(lane.id) || 0;
    const branchWidth = caseCount > 1 ? minLaneW + (caseCount - 1) * caseSpread : minLaneW;
    const contentWidth = Math.max(headerWidth, maxStepWidth, branchWidth);
    return Math.max(minLaneW, Math.min(maxLaneW, contentWidth));
  });
  const laneOffsets = [];
  let laneCursor = sidePad;
  laneWidths.forEach((w, idx) => {
    laneOffsets[idx] = laneCursor;
    laneCursor += w;
  });

  const width = laneCursor + sidePad;
  const baseBottomPadding = 50;

  const laneIndex = (id) => laneIndexById.get(id) ?? -1;
  const laneX = (i) => laneOffsets[i] ?? sidePad;
  const laneCenter = (i) => laneX(i) + (laneWidths[i] ?? minLaneW) / 2;
  const laneWidth = (i) => laneWidths[i] ?? minLaneW;

  frames.forEach((f) => {
    const casesByLane = new Map();
    f.cases.forEach((c, idx) => {
      const firstStep = c.rowIndices.find((stepIdx) => {
        const r = rows[stepIdx];
        return r.kind === "step" && !r.empty && r.role;
      });
      if (firstStep == null) return;
      const laneId = rows[firstStep].role;
      const list = casesByLane.get(laneId) || [];
      list.push(idx);
      casesByLane.set(laneId, list);
    });

    f.cases.forEach((c) => {
      const firstStep = c.rowIndices.find((idx) => {
        const r = rows[idx];
        return r.kind === "step" && !r.empty && r.role;
      });
      if (firstStep != null) {
        const r = rows[firstStep];
        const li = laneIndex(r.role);
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

    casesByLane.forEach((indices) => {
      if (indices.length <= 1) return;
      const spread = caseSpread;
      const center = (indices.length - 1) / 2;
      indices.forEach((caseIdx, j) => {
        const c = f.cases[caseIdx];
        c.offset = (j - center) * spread;
      });
    });
  });

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
  frames.forEach((f) => {
    f.cases.forEach((c) => {
      const offset = c.offset || 0;
      if (!offset) return;
      c.rowIndices.forEach((stepIdx) => {
        const row = rows[stepIdx];
        if (row?.kind === "step" && !row.empty && row.role)
          stepOffsetByIndex.set(stepIdx, offset);
      });
    });
  });
  function nodeCenterX(stepIdx, roleId) {
    const li = laneIndex(roleId);
    if (li < 0) return width / 2;
    const baseX = laneCenter(li);
    const offset = stepOffsetByIndex.get(stepIdx) || 0;
    return baseX + offset;
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
    const fromIdx = laneIndex(prev.r.role);
    const toIdx = laneIndex(cur.r.role);
    if (fromIdx < 0 || toIdx < 0) continue;
    const fromX = nodeCenterX(prev.i, prev.r.role);
    const toX = nodeCenterX(cur.i, cur.r.role);
    connectors.push({
      fromX,
      toX,
      y1: prev.y + rowH / 2 + 22,
      y2: cur.y + rowH / 2 - 22,
      key: `c-${i}`,
    });
  }

  const firstStep = stepRows[0];
  const lastStep = stepRows[stepRows.length - 1];
  const hasStartTerminal = Boolean(firstStep && laneIndex(firstStep.r.role) >= 0);
  const hasEndTerminal = Boolean(lastStep && laneIndex(lastStep.r.role) >= 0);
  const startTerminal = hasStartTerminal
    ? {
        x: nodeCenterX(firstStep.i, firstStep.r.role),
        y: firstStep.y + rowH / 2 - 22 - terminalGap,
        targetY: firstStep.y + rowH / 2 - 22,
      }
    : null;
  const endTerminal = hasEndTerminal
    ? {
        x: nodeCenterX(lastStep.i, lastStep.r.role),
        y: lastStep.y + rowH / 2 + 22 + terminalGap,
        sourceY: lastStep.y + rowH / 2 + 22,
      }
    : null;
  const endTerminalBottom = endTerminal
    ? endTerminal.y + terminalRadius + 16
    : 0;
  const height = Math.max(y + baseBottomPadding, endTerminalBottom);

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

      <rect
        width={width}
        height={height}
        fill="url(#gridp)"
        opacity="0.5"
      />

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
            <rect
              x={x}
              y={topPad}
              width={currentLaneW}
              height={height - topPad - 20}
              fill="none"
              stroke={theme.stroke}
              strokeWidth="1.2"
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
          </g>
        );
      })}

      {/* Branch core: decision diamond (if) and merge diamond (endif) */}
      {frames.map((f) => {
        if (f.yMerge == null) return null;

        const dCx = f.cases[0].x || width / 2;
        const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
        const dW = Math.max(140, (f.cond.length + 4) * 9);
        const dH = 50;

        const mCx = dCx;
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
              const firstStepIdx = c.rowIndices.find(
                (idx) => rows[idx].kind === "step"
              );
              let targetY;
              let targetX = c.x;
              let caseLaneWidth = minLaneW;
              if (firstStepIdx != null) {
                const sy = rowMeta[firstStepIdx]?.y;
                targetY = sy + rowH / 2 - 22;
                const r = rows[firstStepIdx];
                if (r.role) {
                  const li = laneIndex(r.role);
                  if (li >= 0) {
                    targetX = nodeCenterX(firstStepIdx, r.role);
                    caseLaneWidth = laneWidth(li);
                  }
                }
              } else {
                targetY = mCy - mH / 2 - 4;
              }

              const startX = dCx;
              const startY = dCy + dH / 2;
              const sideOffset = c.offset || 0;
              const bendY = startY + branchCaseBendYOffset;
              const sideX = targetX + sideOffset;
              const laneSafeMin = targetX - caseLaneWidth / 2 + 16;
              const laneSafeMax = targetX + caseLaneWidth / 2 - 16;
              const clampedSideX = Math.max(laneSafeMin, Math.min(laneSafeMax, sideX));
              const edgeD =
                firstStepIdx != null && sideOffset !== 0
                  ? `M ${startX} ${startY} L ${startX} ${bendY} L ${clampedSideX} ${bendY} L ${clampedSideX} ${targetY}`
                  : targetX === startX
                    ? `M ${startX} ${startY} L ${targetX} ${targetY}`
                    : `M ${startX} ${startY} L ${startX} ${bendY} L ${targetX} ${bendY} L ${targetX} ${targetY}`;

              return (
                <g key={`case-${f.id}-${ci}`}>
                  <path
                    d={edgeD}
                    fill="none"
                    stroke={theme.stroke}
                    strokeWidth="1.6"
                    markerEnd={
                      firstStepIdx != null
                        ? "url(#arrowhead)"
                        : undefined
                    }
                  />
                </g>
              );
            })}

            {/* Branch fan-in: each case path -> merge */}
            {f.cases.map((c, ci) => {
              const lastStepIdx = [...c.rowIndices]
                .reverse()
                .find((idx) => rows[idx].kind === "step");
              let fromX, fromY;
              if (lastStepIdx != null) {
                const r = rows[lastStepIdx];
                const sy = rowMeta[lastStepIdx]?.y;
                if (r.empty) {
                  fromX = c.x;
                  fromY = sy + rowH / 2 + 8;
                } else {
                  const li = laneIndex(r.role);
                  fromX = li >= 0 ? nodeCenterX(lastStepIdx, r.role) : c.x;
                  fromY = sy + rowH / 2 + 22;
                }
              } else {
                fromX = c.x;
                fromY = f.yDecision + diamondH - 4;
              }
              const toX = mCx;
              const toY = mCy - mH / 2;
              const bendY2 = toY - 14;
              const sideOffset = c.offset || 0;
              const viaX = sideOffset !== 0 ? fromX + sideOffset : fromX;
              const d =
                sideOffset !== 0
                  ? `M ${fromX} ${fromY} L ${viaX} ${fromY} L ${viaX} ${bendY2} L ${toX} ${bendY2} L ${toX} ${toY}`
                  : fromX === toX
                    ? `M ${fromX} ${fromY} L ${toX} ${toY}`
                    : `M ${fromX} ${fromY} L ${fromX} ${bendY2} L ${toX} ${bendY2} L ${toX} ${toY}`;
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
          if (rows[j].kind === "step" && !rows[j].empty && rows[j].role) {
            prevStepIdx = j;
            break;
          }
          if (rows[j].kind === "branchEnd") break;
        }
        const endIdx = rows.findIndex(
          (r) => r.kind === "branchEnd" && r.id === f.id
        );
        let nextStepIdx = -1;
        for (let j = endIdx + 1; j < rows.length; j++) {
          if (rows[j].kind === "step" && !rows[j].empty && rows[j].role) {
            nextStepIdx = j;
            break;
          }
          if (rows[j].kind === "branchStart") break;
        }

        const dCx = f.cases[0].x || width / 2;
        const dTopY = f.yDecision + diamondH / 2 + decisionYOffset - 25;
        const mCx = dCx;
        const mBotY = f.yMerge + mergeH / 2 + 14;

        const edges = [];
        if (prevStepIdx >= 0) {
          const r = rows[prevStepIdx];
          const li = laneIndex(r.role);
          const sx = li >= 0 ? nodeCenterX(prevStepIdx, r.role) : dCx;
          const sy = rowMeta[prevStepIdx].y + rowH / 2 + 22;
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
          const ty = rowMeta[nextStepIdx].y + rowH / 2 - 22;
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
              cy={yRow + rowH / 2}
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
        const cy = yRow + rowH / 2;
        const boxW = nodeW;
        const boxH = 44;

        const fill = (block && block.bg) || lane.bg || theme.boxBg;
        const txtColor =
          (block && block.textColor) || lane.textColor || theme.boxText;
        const stroke = (block && block.borderColor) || theme.stroke;
        const shape = (block && block.shape) || "rounded";
        const blockIcon = block && block.icon;

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
            {r.blockRef && (
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
            {shape && (
              <text
                x={cx - boxW / 2 + 4}
                y={cy - boxH / 2 - 5}
                textAnchor="start"
                fontSize="8"
                fontFamily="'JetBrains Mono',monospace"
                opacity="0.45"
                capitalize
              >
                {shape.toUpperCase()}
              </text>
            )}
          </g>
        );
      })}

      {/* Split labels overlay: draw last so they stay above all diagram elements */}
      {frames.map((f) => {
        if (f.yMerge == null) return null;

        const dCy = f.yDecision + diamondH / 2 + decisionYOffset;
        const dH = 50;

        return f.cases.map((c, ci) => {
          const firstStepIdx = c.rowIndices.find(
            (idx) => rows[idx].kind === "step"
          );
          let targetY;
          let targetX = c.x;
          if (firstStepIdx != null) {
            const sy = rowMeta[firstStepIdx]?.y;
            targetY = sy + rowH / 2 - 22;
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
          const sideOffset = c.offset || 0;
          const labelX = sideOffset !== 0 ? targetX + sideOffset : targetX;
          const labelY = bendY + 18;
          const labelW = (c.label.length + 2) * 8.5;

          return (
            <g key={`case-label-overlay-${f.id}-${ci}`}>
              <rect
                x={labelX - labelW / 2}
                y={labelY - 11}
                width={labelW}
                height={20}
                rx="3"
                fill={theme.bg}
                fillOpacity="0.9"
                stroke={theme.branch}
                strokeWidth="0.9"
              />
              <text
                x={labelX}
                y={labelY + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fontFamily="'Noto Sans JP',sans-serif"
                fill={theme.branch}
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
