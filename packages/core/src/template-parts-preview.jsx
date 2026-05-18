import { useMemo } from "react";
import { parseDSLParts } from "./parser.js";
import { truncate } from "./utils.js";
import { StepShape } from "./diagram/step-shape.jsx";
import { BlockIcon } from "./diagram/block-icon.jsx";

const DOC_W = 65;
const DOC_H = 40;
const BOX_W = 120;
const BOX_H = 44;

function PropDocChip({ prop, x, y, theme }) {
  const fill = prop.bg || theme.bg;
  const strokeCol = prop.borderColor || theme.stroke;
  const labelColor = prop.textColor || theme.title;
  const maxLen =
    typeof prop.maxChars === "number" && prop.maxChars > 0 ? prop.maxChars : 9;
  const tip = prop.title || prop.label || prop.id;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <title>{tip}</title>
      <path
        d={`M 0 0 H ${DOC_W - 8} L ${DOC_W} 8 V ${DOC_H} H 0 Z`}
        fill={fill}
        stroke={strokeCol}
        strokeWidth="1.1"
      />
      <path
        d={`M ${DOC_W - 8} 0 V 8 H ${DOC_W}`}
        fill="none"
        stroke={strokeCol}
        strokeWidth="1"
      />
      <text
        x={DOC_W / 2 - 2}
        y={12}
        textAnchor="middle"
        fontFamily="'JetBrains Mono',monospace"
        fontSize="9"
        fill={labelColor}
      >
        {truncate(prop.label || prop.id, maxLen)}
      </text>
    </g>
  );
}

function PropPreviewItem({ prop, theme }) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <svg
        width={DOC_W + 8}
        height={DOC_H + 8}
        className="overflow-visible"
      >
        <PropDocChip prop={prop} x={4} y={4} theme={theme} />
      </svg>
      <span className="font-mono text-[10px] text-stone-500">{prop.id}</span>
    </div>
  );
}

function BlockPreviewItem({ block, theme }) {
  const shape = block.shape || "rounded";
  const fill = block.bg || theme.boxBg;
  const stroke = block.borderColor || theme.stroke;
  const textColor = block.textColor || theme.boxText;
  const cx = BOX_W / 2 + 8;
  const cy = BOX_H / 2 + 8;
  const iconX = cx - BOX_W / 2;
  const iconY = cy;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <svg width={BOX_W + 16} height={BOX_H + 16} className="overflow-visible">
        <StepShape
          shape={shape}
          cx={cx}
          cy={cy}
          w={BOX_W}
          h={BOX_H}
          fill={fill}
          stroke={stroke}
        />
        <BlockIcon
          icon={block.icon}
          x={iconX}
          y={iconY}
          size={14}
          color={textColor}
          shape={shape}
        />
      </svg>
      <span className="font-mono text-[10px] text-stone-500">{block.id}</span>
    </div>
  );
}

export function TemplatePartsPreview({ code, theme }) {
  const { blocks, props, errors } = useMemo(() => parseDSLParts(code), [code]);

  if (errors.length > 0) {
    return (
      <p className="text-xs text-red-600 font-jp px-2 py-3">
        {errors[0].msg}
      </p>
    );
  }

  const blockList = Object.values(blocks);
  const propList = Object.values(props);

  if (blockList.length === 0 && propList.length === 0) {
    return (
      <p className="text-xs text-stone-500 font-jp px-2 py-3">定義がありません</p>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      {blockList.length > 0 ? (
        <div className="flex flex-wrap gap-4 justify-center">
          {blockList.map((block) => (
            <BlockPreviewItem key={block.id} block={block} theme={theme} />
          ))}
        </div>
      ) : null}
      {propList.length > 0 ? (
        <div className="flex flex-wrap gap-4 justify-center">
          {propList.map((prop) => (
            <PropPreviewItem key={prop.id} prop={prop} theme={theme} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
