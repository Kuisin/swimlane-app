import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { parseDSL } from "@kai-swimlane/core";
import { useEditor } from "../hooks/use-editor";
import { useUnsavedGuard } from "../hooks/use-unsaved-guard";
import { applyModelEdit, parseGuiModel } from "../lib/gui-model";
import {
  buildLockedGuiRowIndices,
  canUseGuiEditing,
  isGuiRowEditingLocked,
  mustChooseParseErrorPolicy,
} from "../lib/parse-error-policy";
import {
  isStepInspectorMessage,
  postStepInspectorMessage,
} from "../lib/step-inspector-channel";
import { InspectorDraftPanel } from "../components/gui/inspector-draft-panel";

const BRANCH_KINDS = [
  "branchStart",
  "branchCase",
  "branchEnd",
  "branchLoop",
  "branchMerge",
];

function inspectorTitle(row, rows) {
  if (!row) return "手順の詳細";
  if (row.kind === "step" && !row.empty) {
    return row.text?.trim() || row.name?.trim() || "ステップ";
  }
  if (row.kind === "branchEnd") {
    const start = rows?.find(
      (r) => r.kind === "branchStart" && r.id === row.id,
    );
    if (start?.parallel) return "並行処理（終了）";
    return "条件分岐（終了）";
  }
  if (row.kind === "branchStart") {
    return row.parallel ? "並行処理（開始）" : "条件分岐";
  }
  if (row.kind === "branchMerge") return "途中合流";
  if (BRANCH_KINDS.includes(row.kind)) return "分岐";
  return "手順の詳細";
}

export function StepInspectorPopupPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const documentId = searchParams.get("doc");
  const rowParam = searchParams.get("row");
  const rowIndex = rowParam != null && rowParam !== "" ? Number(rowParam) : null;

  const { documents, isHydrated, themeKey, updateDocumentSrc } = useEditor();
  const { onDirtyChange, guardUnsaved } = useUnsavedGuard();
  const activeRowRef = useRef(rowIndex);
  const guardRef = useRef(guardUnsaved);

  useEffect(() => {
    guardRef.current = guardUnsaved;
  }, [guardUnsaved]);

  const document = documents.find((doc) => doc.id === documentId);
  const src = document?.src ?? "";
  // The React Compiler cannot prove buildLockedGuiRowIndices leaves guiModel.rows
  // unmutated, so it won't preserve these src-derived memos and skips optimizing
  // this component. The memoization is correct (everything derives from `src`),
  // so suppress the false positive rather than drop the memos.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const guiModel = useMemo(() => parseGuiModel(src), [src]);
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const model = useMemo(() => parseDSL(src), [src]);
  const lockedRowIndices = useMemo(
    () => buildLockedGuiRowIndices(guiModel.rows, model.errors),
    [guiModel.rows, model.errors],
  );
  const needsChoice = mustChooseParseErrorPolicy(
    model.errors,
    document?.parseErrorPolicy ?? null,
  );
  const inspectorEditingDisabled =
    !canUseGuiEditing(model.errors, document?.parseErrorPolicy ?? null) ||
    (rowIndex != null &&
      Number.isFinite(rowIndex) &&
      isGuiRowEditingLocked(rowIndex, lockedRowIndices));

  const selectedRow =
    rowIndex != null && Number.isFinite(rowIndex)
      ? guiModel.rows[rowIndex]
      : null;

  const applyRowToDocument = useCallback(
    (rowDraft, saveRowIndex) => {
      const idx =
        typeof saveRowIndex === "number" && saveRowIndex >= 0
          ? saveRowIndex
          : rowIndex;
      if (!documentId || idx == null || !Number.isFinite(idx)) return;
      updateDocumentSrc(
        documentId,
        applyModelEdit(src, (draft) => {
          Object.assign(draft.rows[idx], rowDraft);
        }),
      );
    },
    [documentId, rowIndex, src, updateDocumentSrc],
  );

  const applyRowsPatch = useCallback(
    (editFn) => {
      if (!documentId) return;
      updateDocumentSrc(documentId, applyModelEdit(src, editFn));
    },
    [documentId, src, updateDocumentSrc],
  );

  const navigateToRow = useCallback(
    (nextDocumentId, nextRowIndex) => {
      const params = new URLSearchParams();
      if (nextDocumentId) params.set("doc", nextDocumentId);
      if (nextRowIndex != null) params.set("row", String(nextRowIndex));
      setSearchParams(params, { replace: true });
      activeRowRef.current = nextRowIndex;
    },
    [setSearchParams]
  );

  const requestNavigate = useCallback(
    (nextDocumentId, nextRowIndex) => {
      if (
        nextDocumentId === documentId &&
        nextRowIndex === activeRowRef.current
      ) {
        return;
      }

      if (!guardRef.current()) {
        postStepInspectorMessage(window.opener, {
          type: "select-revert",
          rowIndex: activeRowRef.current,
        });
        return;
      }

      navigateToRow(nextDocumentId, nextRowIndex);
    },
    [documentId, navigateToRow]
  );

  useEffect(() => {
    if (rowIndex === activeRowRef.current) return;
    if (activeRowRef.current == null && rowIndex != null) {
      activeRowRef.current = rowIndex;
      return;
    }

    if (!guardRef.current()) {
      navigateToRow(documentId, activeRowRef.current);
      postStepInspectorMessage(window.opener, {
        type: "select-revert",
        rowIndex: activeRowRef.current,
      });
      return;
    }

    activeRowRef.current = rowIndex;
  }, [documentId, navigateToRow, rowIndex]);

  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (!isStepInspectorMessage(event.data)) return;

      if (event.data.type === "navigate") {
        requestNavigate(event.data.documentId, event.data.rowIndex);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [requestNavigate]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        if (!guardRef.current()) return;
        window.close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleClose() {
    if (!guardRef.current()) return;
    window.close();
  }

  return (
    <div className="h-dvh w-dvw bg-stone-900 text-stone-100 flex flex-col">
      <PopupStyles />
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-stone-700 shrink-0">
        <h1 className="font-jp text-sm font-medium text-stone-100 truncate pr-2">
          {inspectorTitle(selectedRow, guiModel.rows)}
        </h1>
        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded hover:bg-stone-800 text-stone-400 shrink-0"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </header>
      <InspectorPopupBody
        isHydrated={isHydrated}
        hasDocument={!!document}
        selectedRow={selectedRow}
        rowIndex={rowIndex}
        guiModel={guiModel}
        model={model}
        themeKey={themeKey}
        onSave={applyRowToDocument}
        onRowsPatch={applyRowsPatch}
        onDirtyChange={onDirtyChange}
        editingDisabled={inspectorEditingDisabled}
        needsChoice={needsChoice}
      />
    </div>
  );
}

function InspectorPopupBody({
  isHydrated,
  hasDocument,
  selectedRow,
  rowIndex,
  guiModel,
  model,
  themeKey,
  onSave,
  onRowsPatch,
  onDirtyChange,
  editingDisabled,
  needsChoice,
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      {!isHydrated ? (
        <p className="p-4 text-xs text-stone-500 font-jp">読み込み中…</p>
      ) : !hasDocument ? (
        <p className="text-xs font-jp text-stone-500 px-3 py-4">
          ドキュメントが見つかりません。
        </p>
      ) : needsChoice ? (
        <p className="text-xs font-jp text-stone-500 px-3 py-4">
          メイン画面の GUI で構文エラーの続行方法を選んでください。
        </p>
      ) : (
        <InspectorDraftPanel
          row={selectedRow}
          rowIndex={rowIndex}
          guiModel={guiModel}
          model={model}
          themeKey={themeKey}
          onSave={onSave}
          onRowsPatch={onRowsPatch}
          onDirtyChange={onDirtyChange}
          editingDisabled={editingDisabled}
        />
      )}
    </div>
  );
}

function PopupStyles() {
  return (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-jp { font-family: 'Noto Sans JP', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>
  );
}
