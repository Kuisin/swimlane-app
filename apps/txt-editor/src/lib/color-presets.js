/** Preset colors from template.md and branch styles — for GUI color fields. */

export const COLOR_PRESET_GROUPS = [
  {
    id: "neutral",
    label: "グレー・白",
    colors: [
      { value: "#ffffff", label: "白" },
      { value: "#f8fafc", label: "スレート50" },
      { value: "#f5f5f4", label: "ストーン100" },
      { value: "#f4f4f5", label: "ジンク100" },
      { value: "#e5e7eb", label: "グレー200" },
      { value: "#64748b", label: "スレート500（枠）" },
      { value: "#334155", label: "スレート700" },
      { value: "#1e293b", label: "スレート800" },
      { value: "#111827", label: "グレー900" },
    ],
  },
  {
    id: "blue",
    label: "青（申請・システム）",
    colors: [
      { value: "#eff6ff", label: "背景・淡青" },
      { value: "#dbeafe", label: "背景・青" },
      { value: "#e0e7ff", label: "背景・インディゴ" },
      { value: "#e0f2fe", label: "背景・シアン" },
      { value: "#1e40af", label: "文字・青" },
      { value: "#3730a3", label: "文字・インディゴ" },
      { value: "#075985", label: "文字・シアン" },
      { value: "#2563eb", label: "枠・青" },
      { value: "#4f46e5", label: "枠・インディゴ" },
      { value: "#0284c7", label: "枠・シアン" },
    ],
  },
  {
    id: "green",
    label: "緑（承認）",
    colors: [
      { value: "#f0fdf4", label: "背景・淡緑" },
      { value: "#dcfce7", label: "背景・緑" },
      { value: "#166534", label: "文字・緑" },
      { value: "#15803d", label: "分岐・緑" },
      { value: "#16a34a", label: "枠・緑" },
    ],
  },
  {
    id: "red",
    label: "赤（却下・警告）",
    colors: [
      { value: "#fee2e2", label: "背景・赤" },
      { value: "#ffedd5", label: "背景・オレンジ" },
      { value: "#991b1b", label: "文字・赤" },
      { value: "#b91c1c", label: "分岐・赤" },
      { value: "#dc2626", label: "枠・赤" },
      { value: "#c2410c", label: "分岐・オレンジ" },
    ],
  },
  {
    id: "purple",
    label: "紫（人事・法務）",
    colors: [
      { value: "#faf5ff", label: "背景・淡紫" },
      { value: "#f5f3ff", label: "背景・バイオレット" },
      { value: "#f3e8ff", label: "背景・紫" },
      { value: "#6b21a8", label: "文字・紫" },
      { value: "#5b21b6", label: "文字・バイオレット" },
      { value: "#7e22ce", label: "分岐・紫" },
      { value: "#9333ea", label: "枠・紫" },
    ],
  },
  {
    id: "amber",
    label: "黄・茶（区分・取引先）",
    colors: [
      { value: "#fffbeb", label: "背景・アンバー" },
      { value: "#fef3c7", label: "背景・黄" },
      { value: "#92400e", label: "文字・茶" },
      { value: "#444444", label: "文字・区分灰" },
    ],
  },
  {
    id: "branch",
    label: "分岐アクセント（if）",
    colors: [
      { value: "#dbeafe", label: "blue 背景" },
      { value: "#2563eb", label: "blue 線" },
      { value: "#dcfce7", label: "green 背景" },
      { value: "#15803d", label: "green 線" },
      { value: "#fee2e2", label: "red 背景" },
      { value: "#b91c1c", label: "red 線" },
      { value: "#ffedd5", label: "orange 背景" },
      { value: "#c2410c", label: "orange 線" },
      { value: "#f3e8ff", label: "purple 背景" },
      { value: "#7e22ce", label: "purple 線" },
      { value: "#f3f4f6", label: "gray 背景" },
      { value: "#374151", label: "gray 線" },
      { value: "#e5e7eb", label: "black 背景" },
      { value: "#111827", label: "black 線" },
    ],
  },
];

export function normalizeHexColor(value) {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return null;
}

export function findMatchingPresetValue(value) {
  const normalized = normalizeHexColor(value);
  if (!normalized) return "";
  for (const group of COLOR_PRESET_GROUPS) {
    for (const color of group.colors) {
      if (normalizeHexColor(color.value) === normalized) return color.value;
    }
  }
  return "";
}
