import { useEffect } from "react";
import { useTemplateDraft } from "../../hooks/use-template-draft";
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
        <BranchInspector
          row={draft}
          rows={guiModel.rows}
          onPatch={patch}
        />
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
      <div className="px-3 py-3 border-t border-stone-700 flex flex-wrap gap-2 shrink-0">
        <button
          type="button"
          disabled={!isDirty}
          onClick={() => onSave(draft)}
          className="text-xs font-jp px-3 py-1.5 rounded border border-stone-500 bg-stone-100 text-stone-900 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          保存
        </button>
        <button
          type="button"
          disabled={!isDirty}
          onClick={reset}
          className="text-xs font-jp px-3 py-1.5 rounded border border-stone-600 text-stone-300 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          元に戻す
        </button>
      </div>
    </div>
  );
}
