import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { parseDSL } from "@kai-swimlane/core";
import { useEditor } from "../hooks/use-editor";
import { useUnsavedGuard } from "../hooks/use-unsaved-guard";
import { applyModelEdit, parseGuiModel } from "../lib/gui-model";
import {
  isStepInspectorMessage,
  postStepInspectorMessage,
} from "../lib/step-inspector-channel";
import { InspectorDraftPanel } from "../components/gui/inspector-draft-panel";

const BRANCH_KINDS = ["branchStart", "branchCase", "branchEnd", "branchLoop"];

function inspectorTitle(row) {
  if (!row) return "手順の詳細";
  if (row.kind === "step" && !row.empty) {
    return row.text?.trim() || row.name?.trim() || "ステップ";
  }
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
  const guiModel = useMemo(() => parseGuiModel(src), [src]);
  const model = useMemo(() => parseDSL(src), [src]);

  const selectedRow =
    rowIndex != null && Number.isFinite(rowIndex)
      ? guiModel.rows[rowIndex]
      : null;
  const isBranchRow =
    selectedRow && BRANCH_KINDS.includes(selectedRow.kind);

  const applyRowToDocument = useCallback(
    (rowDraft) => {
      if (!documentId || rowIndex == null || !Number.isFinite(rowIndex)) return;
      updateDocumentSrc(
        documentId,
        applyModelEdit(src, (draft) => {
          Object.assign(draft.rows[rowIndex], rowDraft);
        })
      );
    },
    [documentId, rowIndex, src, updateDocumentSrc]
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
          {inspectorTitle(selectedRow)}
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
        isBranchRow={isBranchRow}
        selectedRow={selectedRow}
        guiModel={guiModel}
        model={model}
        themeKey={themeKey}
        onSave={applyRowToDocument}
        onDirtyChange={onDirtyChange}
      />
    </div>
  );
}

function InspectorPopupBody({
  isHydrated,
  hasDocument,
  isBranchRow,
  selectedRow,
  guiModel,
  model,
  themeKey,
  onSave,
  onDirtyChange,
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      {!isHydrated ? (
        <p className="p-4 text-xs text-stone-500 font-jp">読み込み中…</p>
      ) : !hasDocument ? (
        <p className="text-xs font-jp text-stone-500 px-3 py-4">
          ドキュメントが見つかりません。
        </p>
      ) : (
        <InspectorDraftPanel
          row={selectedRow}
          isBranchRow={isBranchRow}
          guiModel={guiModel}
          model={model}
          themeKey={themeKey}
          onSave={onSave}
          onDirtyChange={onDirtyChange}
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
