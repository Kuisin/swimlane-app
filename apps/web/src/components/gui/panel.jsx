import { EditorActionBar } from "../editor/action-bar";
import { EditorErrorList } from "../editor/error-list";
import { getModelCounts } from "../editor/model-counts";
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
      <div className="px-3 sm:px-4 py-2 border-b border-stone-700/60 shrink-0">
        <label className="block text-[10px] font-jp text-stone-500 mb-1">
          タイトル
        </label>
        <input
          type="text"
          value={model.title}
          onChange={(event) => onTitleChange(event.target.value)}
          className={titleInputClass}
        />
      </div>
      <FlowStepList
        rows={guiModel.rows}
        selectedRowIndex={selectedRowIndex}
        onSelectRow={onSelectRow}
        onEditRows={onEditRows}
        lanes={guiModel.lanes}
      />
      <EditorErrorList errors={model.errors} />
    </div>
  );
}
