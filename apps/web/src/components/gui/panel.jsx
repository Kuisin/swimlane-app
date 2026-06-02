import { useMemo } from "react";
import { EditorActionBar } from "../editor/action-bar";
import { EditorErrorList } from "../editor/error-list";
import { ParseErrorPrompt } from "../editor/parse-error-prompt";
import { getModelCounts } from "../editor/model-counts";
import { useEditor } from "../../hooks/use-editor";
import {
  buildLockedGuiRowIndices,
  canUseGuiEditing,
  mustChooseParseErrorPolicy,
} from "../../lib/parse-error-policy";
import { FlowStepList } from "./flow-step-list";

const titleInputClass =
  "w-full min-w-0 rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm font-jp text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-500";

export function GuiModePanel({
  src,
  model,
  guiModel,
  themeBg,
  showStepBlockCaptions,
  hasUnsavedChanges,
  onSave,
  onTitleChange,
  selectedRowIndex,
  onSelectRow,
  onEditRows,
}) {
  const {
    activeParseErrorPolicy,
    setActiveDocumentParseErrorPolicy,
  } = useEditor();

  const errors = model.errors;
  const needsChoice = mustChooseParseErrorPolicy(errors, activeParseErrorPolicy);
  const guiEditingEnabled = canUseGuiEditing(errors, activeParseErrorPolicy);
  const lockedRowIndices = useMemo(
    () => buildLockedGuiRowIndices(guiModel.rows, errors),
    [guiModel.rows, errors],
  );

  return (
    <div className="flex flex-col min-h-0 h-full">
      <EditorActionBar
        modelType="gui"
        src={src}
        modelTitle={model.title}
        themeBg={themeBg}
        showStepBlockCaptions={showStepBlockCaptions}
        counts={getModelCounts(guiModel)}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
      />
      {needsChoice && errors.length > 0 && (
        <ParseErrorPrompt
          errors={errors}
          onChooseFix={() => setActiveDocumentParseErrorPolicy("fix")}
          onChooseContinue={() =>
            setActiveDocumentParseErrorPolicy("continue")
          }
        />
      )}
      {guiEditingEnabled && lockedRowIndices.size > 0 && (
        <p className="shrink-0 px-3 py-1.5 text-[10px] font-jp text-stone-400 border-b border-stone-700/60 bg-stone-900/80">
          グレー表示のブロックは構文エラー行のため編集できません。他のブロックは編集できます。
        </p>
      )}
      <div className="px-3 sm:px-4 py-2 border-b border-stone-700/60 shrink-0">
        <label className="block text-[10px] font-jp text-stone-500 mb-1">
          タイトル
        </label>
        <input
          type="text"
          value={model.title}
          onChange={(event) => onTitleChange(event.target.value)}
          disabled={!guiEditingEnabled}
          className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>
      <FlowStepList
        rows={guiModel.rows}
        selectedRowIndex={selectedRowIndex}
        onSelectRow={onSelectRow}
        onEditRows={onEditRows}
        lanes={guiModel.lanes}
        editingDisabled={!guiEditingEnabled}
        lockedRowIndices={lockedRowIndices}
      />
      {!needsChoice && <EditorErrorList errors={errors} />}
    </div>
  );
}
