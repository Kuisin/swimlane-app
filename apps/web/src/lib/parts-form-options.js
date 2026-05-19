import { getIconNames } from "@kai-swimlane/core";

export const BLOCK_SHAPE_OPTIONS = [
  { value: "rounded", label: "rounded（角丸）" },
  { value: "rect", label: "rect（矩形）" },
  { value: "hex", label: "hex（六角）" },
  { value: "subroutine", label: "subroutine" },
  { value: "note", label: "note（付箋）" },
  { value: "cloud", label: "cloud" },
  { value: "ellipse", label: "ellipse" },
];

export const PROP_SIDE_OPTIONS = [
  { value: "right", label: "right（右）" },
  { value: "left", label: "left（左）" },
];

export const ICON_OPTIONS = getIconNames().map((name) => ({
  value: `#${name}`,
  label: name,
}));
