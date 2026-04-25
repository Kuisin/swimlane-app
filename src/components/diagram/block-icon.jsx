import { getLucideIcon } from "../../lib/icon-registry";

const EMOJI_RE = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

function isEmoji(str) {
  return EMOJI_RE.test(str);
}

export function BlockIcon({ icon, x, y, size, color, shape }) {
  if (!icon) return null;

  var iconX = "";
  var iconY = "";
  switch (shape) {
    case "rect":
      iconX = x + 16;
      iconY = y;
      break;
    case "ellipse":
      iconX = x + 16;
      iconY = y;
      break;
    case "hex":
      iconX = x + 22;
      iconY = y;
      break;
    case "note":
      iconX = x + 16;
      iconY = y;
      break;
    case "subroutine":
      iconX = x + 26;
      iconY = y;
      break;
    case "cloud":
      iconX = x + 22;
      iconY = y + 3;
      break;
    default:
      iconX = x + 16;
      iconY = y;
      break;
  }

  if (icon.startsWith("#")) {
    const name = icon.slice(1);
    const LucideComp = getLucideIcon(name);
    if (LucideComp) {
      return (
        <LucideComp
          x={iconX - size / 2}
          y={iconY - size / 2}
          width={size}
          height={size}
          color={color}
          strokeWidth={2}
          fill="none"
        />
      );
    }
  }

  const display = icon.startsWith("#") ? icon.slice(1) : icon;
  const fontSize = isEmoji(display) ? size : size * 0.85;

  return (
    <text
      x={iconX}
      y={iconY}
      textAnchor="middle"
      fontSize={fontSize}
      fill={color}
      fontFamily="'Noto Sans JP',sans-serif"
    >
      {display}
    </text>
  );
}
