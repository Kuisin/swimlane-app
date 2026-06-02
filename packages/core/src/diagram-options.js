/** Default diagram render flags when not set in `/option/` or local editor prefs. */
export const DEFAULT_DIAGRAM_OPTIONS = {
  showRightRemarks: true,
  showLeftRemarks: true,
  showLeftGutter: true,
  showStepBlockCaptions: true,
  mergeAtPreviousBlock: true,
};

/** DSL kebab keys → model camelCase fields. */
export const DIAGRAM_OPTION_DSL_MAP = {
  "show-right-remarks": "showRightRemarks",
  "show-left-remarks": "showLeftRemarks",
  "show-left-gutter": "showLeftGutter",
  "show-step-block-captions": "showStepBlockCaptions",
  "merge-at-previous-block": "mergeAtPreviousBlock",
};

export const DIAGRAM_OPTION_KEYS = Object.values(DIAGRAM_OPTION_DSL_MAP);

export function emptyDiagramOptions() {
  return {};
}

export function hasDiagramOptionContent(options) {
  if (!options) return false;
  return DIAGRAM_OPTION_KEYS.some((key) => options[key] !== undefined);
}

/** @param {string} raw */
export function parseOptionBoolean(raw) {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (["true", "yes", "on", "1"].includes(v)) return true;
  if (["false", "no", "off", "0"].includes(v)) return false;
  return null;
}

/**
 * Merge `/option/` (when present) over local editor defaults.
 * Only keys explicitly set in `modelOptions` override locals.
 */
export function resolveDiagramOptions(modelOptions, localOverrides = {}) {
  const resolved = {
    ...DEFAULT_DIAGRAM_OPTIONS,
    ...localOverrides,
  };
  if (!modelOptions) return resolved;
  for (const key of DIAGRAM_OPTION_KEYS) {
    if (modelOptions[key] !== undefined) {
      resolved[key] = modelOptions[key];
    }
  }
  return resolved;
}
