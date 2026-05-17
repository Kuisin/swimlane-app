import { useMemo } from "react";
import {
  parseDSL,
  Diagram,
  THEMES,
  normalizeFullFenceDSL,
} from "@kai-swimlane/core";

export function KaiSwimlanePreview({
  code,
  themeKey = "basic",
  showStepBlockCaptions = false,
  className = "",
}) {
  const model = useMemo(
    () => parseDSL(normalizeFullFenceDSL(code)),
    [code]
  );
  const theme = THEMES[themeKey] || THEMES.basic;
  const hasErrors = model.errors.length > 0;

  return (
    <div className={className} style={{ background: theme.bg }}>
      {hasErrors ? (
        <p className="text-xs text-red-600 px-3 py-4">{model.errors[0].msg}</p>
      ) : (
        <Diagram
          model={model}
          theme={theme}
          showStepBlockCaptions={showStepBlockCaptions}
        />
      )}
    </div>
  );
}
