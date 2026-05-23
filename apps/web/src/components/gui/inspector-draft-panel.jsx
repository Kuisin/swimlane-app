import { useEffect } from "react";
import { useTemplateDraft } from "../../hooks/use-template-draft";
import { DraftActions } from "./draft-actions";
import { StepInspector } from "./step-inspector";
import { BranchInspector } from "./branch-inspector";

export function InspectorDraftPanel({
  row,
  isBranchRow,
  guiModel,
  model,
  themeKey,
  onSave,
  onDirtyChange,
}) {
  const { draft, patch, isDirty, reset } = useTemplateDraft(row);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  if (!row) {
    return (
      <p className="text-xs font-jp text-stone-500 px-3 py-4">
        手順を選択してください
      </p>
    );
  }

  if (!draft) return null;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {isBranchRow ? (
        <BranchInspector row={draft} rows={guiModel.rows} onPatch={patch} />
      ) : (
        <StepInspector
          row={draft}
          lanes={model.lanes}
          blocks={model.blocks}
          props={model.props}
          themeKey={themeKey}
          onPatch={patch}
        />
      )}
      <div className="px-3 py-3 shrink-0">
        <DraftActions
          isDirty={isDirty}
          onSave={() => onSave(draft)}
          onReset={reset}
          variant="dark"
        />
      </div>
    </div>
  );
}
