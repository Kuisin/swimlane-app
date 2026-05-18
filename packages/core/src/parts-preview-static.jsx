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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
      }}
    >
      <svg
        width={DOC_W + 8}
        height={DOC_H + 8}
        style={{ overflow: "visible" }}
      >
        <PropDocChip prop={prop} x={4} y={4} theme={theme} />
      </svg>
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "#78716c",
        }}
      >
        {prop.id}
      </span>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        flexShrink: 0,
      }}
    >
      <svg width={BOX_W + 16} height={BOX_H + 16} style={{ overflow: "visible" }}>
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
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "#78716c",
        }}
      >
        {block.id}
      </span>
    </div>
  );
}

/** SSR / VS Code preview — inline styles only (no Tailwind). */
export function PartsPreviewStatic({ code, theme }) {
  const { blocks, props, errors } = parseDSLParts(code);

  if (errors.length > 0) {
    return (
      <p style={{ color: "#b91c1c", fontSize: 12, margin: "12px 0" }}>
        {errors[0].msg}
      </p>
    );
  }

  const blockList = Object.values(blocks);
  const propList = Object.values(props);

  if (blockList.length === 0 && propList.length === 0) {
    return (
      <p style={{ color: "#78716c", fontSize: 12, margin: "12px 0" }}>
        No block or prop definitions.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 12,
        background: theme.bg,
      }}
    >
      {blockList.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "center",
          }}
        >
          {blockList.map((block) => (
            <BlockPreviewItem key={block.id} block={block} theme={theme} />
          ))}
        </div>
      ) : null}
      {propList.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "center",
          }}
        >
          {propList.map((prop) => (
            <PropPreviewItem key={prop.id} prop={prop} theme={theme} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
