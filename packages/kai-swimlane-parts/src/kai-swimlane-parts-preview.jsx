import { THEMES, TemplatePartsPreview } from "@kai-swimlane/core";

export function KaiSwimlanePartsPreview({
  code,
  themeKey = "basic",
  className = "",
}) {
  const theme = THEMES[themeKey] || THEMES.basic;

  return (
    <div className={className} style={{ background: theme.bg }}>
      <TemplatePartsPreview code={code} theme={theme} />
    </div>
  );
}
