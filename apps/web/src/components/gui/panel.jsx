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
  onPageChange,
  onDiagramOptionChange,
  resolvedDiagramOptions,
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
      <div className="px-3 sm:px-4 py-3 border-b border-stone-700/60 shrink-0 space-y-3">
        <p className="text-[10px] font-jp text-stone-500">ページ設定（/page/）</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={model.page?.leftTitle || ""}
            onChange={(event) => onPageChange({ leftTitle: event.target.value })}
            placeholder="left-title (default: Procedure)"
            disabled={!guiEditingEnabled}
            className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <input
            type="text"
            value={model.page?.leftSubtitle || ""}
            onChange={(event) => onPageChange({ leftSubtitle: event.target.value })}
            placeholder="left-subtitle (default: Description)"
            disabled={!guiEditingEnabled}
            className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <input
            type="text"
            value={model.page?.rightTitle || ""}
            onChange={(event) => onPageChange({ rightTitle: event.target.value })}
            placeholder="right-title (default: Remark)"
            disabled={!guiEditingEnabled}
            className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <input
            type="text"
            value={model.page?.rightSubtitle || ""}
            onChange={(event) => onPageChange({ rightSubtitle: event.target.value })}
            placeholder="right-subtitle"
            disabled={!guiEditingEnabled}
            className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <input
            type="text"
            value={model.page?.headerLeft || ""}
            onChange={(event) => onPageChange({ headerLeft: event.target.value })}
            placeholder="header-left"
            disabled={!guiEditingEnabled}
            className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <input
            type="text"
            value={model.page?.headerCenter || ""}
            onChange={(event) => onPageChange({ headerCenter: event.target.value })}
            placeholder="header-center"
            disabled={!guiEditingEnabled}
            className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <input
            type="text"
            value={model.page?.headerRight || ""}
            onChange={(event) => onPageChange({ headerRight: event.target.value })}
            placeholder="header-right"
            disabled={!guiEditingEnabled}
            className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          <input
            type="text"
            value={model.page?.description || ""}
            onChange={(event) => onPageChange({ description: event.target.value })}
            placeholder="description"
            disabled={!guiEditingEnabled}
            className={`${titleInputClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        </div>
        <p className="text-[10px] font-jp text-stone-500 pt-1">図オプション（/option/）</p>
        <div className="space-y-1">
          {[
            ["showRightRemarks", "右側の備考（props）を表示"],
            ["showLeftRemarks", "左側の備考（props）を表示"],
            ["showLeftGutter", "左カラム（番号・補足）を表示"],
            ["showStepBlockCaptions", "ステップ本文・ブロック参照を出力に含める"],
            ["mergeAtPreviousBlock", "クローズ位置を前ブロックに合わせる"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs font-jp text-stone-300">
              <input
                type="checkbox"
                className="rounded border-stone-500"
                checked={Boolean(resolvedDiagramOptions?.[key])}
                disabled={!guiEditingEnabled}
                onChange={(event) => onDiagramOptionChange(key, event.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
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

