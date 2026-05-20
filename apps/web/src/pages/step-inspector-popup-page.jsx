import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import { parseDSL } from "@kai-swimlane/core";
import { useEditor } from "../hooks/use-editor";
import { applyModelEdit, parseGuiModel } from "../lib/gui-model";
import { StepInspector } from "../components/gui/step-inspector";
import { BranchInspector } from "../components/gui/branch-inspector";

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
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get("doc");
  const rowParam = searchParams.get("row");
  const rowIndex = rowParam != null && rowParam !== "" ? Number(rowParam) : null;

  const { documents, isHydrated, themeKey, updateDocumentSrc } = useEditor();

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

  function patchSelectedRow(patch) {
    if (!documentId || rowIndex == null || !Number.isFinite(rowIndex)) return;
    updateDocumentSrc(
      documentId,
      applyModelEdit(src, (draft) => {
        Object.assign(draft.rows[rowIndex], patch);
      })
    );
  }

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") window.close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="h-dvh w-dvw bg-stone-900 text-stone-100 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-jp { font-family: 'Noto Sans JP', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-stone-700 shrink-0">
        <h1 className="font-jp text-sm font-medium text-stone-100 truncate pr-2">
          {inspectorTitle(selectedRow)}
        </h1>
        <button
          type="button"
          onClick={() => window.close()}
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
        onPatch={patchSelectedRow}
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
  onPatch,
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {!isHydrated ? (
        <p className="p-4 text-xs text-stone-500 font-jp">読み込み中…</p>
      ) : !hasDocument ? (
        <p className="text-xs font-jp text-stone-500 px-3 py-4">
          ドキュメントが見つかりません。
        </p>
      ) : isBranchRow ? (
        <BranchInspector
          row={selectedRow}
          rows={guiModel.rows}
          onPatch={onPatch}
        />
      ) : (
        <StepInspector
          row={selectedRow}
          lanes={model.lanes}
          blocks={model.blocks}
          props={model.props}
          themeKey={themeKey}
          onPatch={onPatch}
        />
      )}
    </div>
  );
}
