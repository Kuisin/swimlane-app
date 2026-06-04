import { useCallback, useMemo } from "react";
import { parseDSL } from "@kai-swimlane/core";
import { useEditor } from "../hooks/use-editor";
import { applyModelEdit, parseGuiModel } from "../lib/gui-model";
import {
  buildLockedGuiRowIndices,
  canUseGuiEditing,
  isGuiRowEditingLocked,
  mustChooseParseErrorPolicy,
} from "../lib/parse-error-policy";
import { InspectorDraftPanel } from "./gui/inspector-draft-panel";

export function StepInspectorPanel({ rowIndex, onDirtyChange, height, flushRef }) {
  const {
    activeDocumentId,
    src,
    themeKey,
    updateDocumentSrc,
    activeParseErrorPolicy,
    isHydrated,
    isReadOnly,
  } = useEditor();

  const guiModel = useMemo(() => parseGuiModel(src), [src]);
  const model = useMemo(() => parseDSL(src), [src]);
  const lockedRowIndices = useMemo(
    () => buildLockedGuiRowIndices(guiModel.rows, model.errors),
    [guiModel.rows, model.errors],
  );

  const needsChoice = mustChooseParseErrorPolicy(model.errors, activeParseErrorPolicy);
  const editingDisabled =
    isReadOnly ||
    !canUseGuiEditing(model.errors, activeParseErrorPolicy) ||
    (rowIndex != null &&
      Number.isFinite(rowIndex) &&
      isGuiRowEditingLocked(rowIndex, lockedRowIndices));

  const selectedRow =
    rowIndex != null && Number.isFinite(rowIndex) ? guiModel.rows[rowIndex] : null;

  const applyRowToDocument = useCallback(
    (rowDraft, saveRowIndex) => {
      const idx =
        typeof saveRowIndex === "number" && saveRowIndex >= 0 ? saveRowIndex : rowIndex;
      if (!activeDocumentId || idx == null || !Number.isFinite(idx)) return null;
      const nextSrc = applyModelEdit(src, (draft) => {
        Object.assign(draft.rows[idx], rowDraft);
      });
      updateDocumentSrc(activeDocumentId, nextSrc);
      return nextSrc;
    },
    [activeDocumentId, rowIndex, src, updateDocumentSrc],
  );

  const applyRowsPatch = useCallback(
    (editFn) => {
      if (!activeDocumentId) return;
      updateDocumentSrc(activeDocumentId, applyModelEdit(src, editFn));
    },
    [activeDocumentId, src, updateDocumentSrc],
  );

  const panelStyle =
    height != null
      ? { height, minHeight: height, maxHeight: height }
      : undefined;
  const panelClass =
    height != null
      ? "overflow-y-auto shrink-0 bg-stone-950/40"
      : "max-h-72 overflow-y-auto shrink-0 bg-stone-950/40";

  if (rowIndex == null) {
    return (
      <p className="text-xs font-jp text-stone-500 px-3 py-4 border-t border-stone-700/60">
        {isReadOnly
          ? "手順を選択すると詳細を表示できます"
          : "手順を選択すると詳細を編集できます"}
      </p>
    );
  }

  if (!isHydrated) {
    return (
      <p className="text-xs font-jp text-stone-500 px-3 py-4 border-t border-stone-700/60">
        読み込み中…
      </p>
    );
  }

  if (needsChoice) {
    return (
      <p className="text-xs font-jp text-stone-500 px-3 py-4 border-t border-stone-700/60">
        構文エラーの続行方法を選んでください。
      </p>
    );
  }

  return (
    <div
      className={`border-t border-stone-700/60 ${panelClass}`}
      style={panelStyle}
    >
      <p className="px-3 py-1.5 text-[10px] font-jp text-stone-500 border-b border-stone-700/40">
        手順の詳細
      </p>
      <InspectorDraftPanel
        row={selectedRow}
        rowIndex={rowIndex}
        guiModel={guiModel}
        model={model}
        themeKey={themeKey}
        onSave={applyRowToDocument}
        onRowsPatch={applyRowsPatch}
        onDirtyChange={onDirtyChange}
        editingDisabled={editingDisabled}
        flushRef={flushRef}
      />
    </div>
  );
}
