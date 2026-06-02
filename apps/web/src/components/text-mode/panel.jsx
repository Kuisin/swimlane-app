import { useMemo } from "react";
import { EditorActionBar } from "../editor/action-bar";
import { EditorErrorList } from "../editor/error-list";
import { getModelCounts } from "../editor/model-counts";
import { errorLineSet } from "../../lib/parse-error-policy";
import { CodeArea } from "./code-area";

export function TextModePanel({
  src,
  onChange,
  model,
  modelTitle,
  themeBg,
  showStepBlockCaptions,
  hasUnsavedChanges,
  onSave,
}) {
  const errors = model.errors;
  const errorLines = useMemo(() => errorLineSet(errors), [errors]);
  const counts = getModelCounts(model);
  const canFormat = errors.length === 0;

  return (
    <div className="flex flex-col min-h-0 h-full">
      <EditorActionBar
        modelType="text"
        src={src}
        onChange={onChange}
        canFormat={canFormat}
        modelTitle={modelTitle}
        themeBg={themeBg}
        showStepBlockCaptions={showStepBlockCaptions}
        counts={counts}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
      />
      <CodeArea src={src} onChange={onChange} errorLines={errorLines} />
      <EditorErrorList errors={errors} includeText />
    </div>
  );
}
