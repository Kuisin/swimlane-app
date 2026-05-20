import { useEffect, useMemo, useRef, useState } from "react";
import { Save } from "lucide-react";
import { Diagram } from "@kai-swimlane/core";
import { Toolbar } from "../components/toolbar";
import { DocumentTabs } from "../components/document-tabs";
import { HelpModal } from "../components/help-modal";
import { FileListModal } from "../components/file-list-modal";
import { useEditor } from "../hooks/use-editor";
import { applyModelEdit, parseGuiModel } from "../lib/gui-model";
import { TitleField } from "../components/gui/title-field";
import { ExportMenu } from "../components/export-menu.jsx";
import { FlowStepList } from "../components/gui/flow-step-list";
import { ToolbarTemplateActions } from "../components/toolbar-template-actions";
import { openStepInspectorPopup } from "../lib/open-step-inspector-popup";
import { isStepInspectorMessage } from "../lib/step-inspector-channel";

export function GuiPage() {
  const editor = useEditor();
  const {
    openDocuments,
    activeDocumentId,
    setActiveDocumentId,
    setOpenDocumentIds,
    themeKey,
    setThemeKey,
    theme,
    showStepBlockCaptions,
    setShowStepBlockCaptions,
    mergeAtPreviousBlock,
    setMergeAtPreviousBlock,
    showHelp,
    setShowHelp,
    showFileList,
    setShowFileList,
    src,
    model,
    hasUnsavedChanges,
    updateActiveDocumentSrc,
    saveDocuments,
    addDocumentTab,
    closeDocumentTab,
    deleteDocumentFromStorage,
    importDocumentFromSrc,
    documents,
    helpMd,
    templateMd,
    isHydrated,
  } = editor;

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const stepInspectorPopupRef = useRef(null);

  const guiModel = useMemo(() => parseGuiModel(src), [src]);
  const stepCount = guiModel.rows.filter((r) => r.kind === "step").length;
  const blockCount = Object.keys(guiModel.blocks || {}).length;

  function onEditRows(editFn) {
    updateActiveDocumentSrc(applyModelEdit(src, editFn));
  }

  function handleTitleChange(title) {
    onEditRows((draft) => {
      draft.title = title;
    });
  }

  function handleSelectRow(index) {
    setSelectedRowIndex(index);
    if (isHydrated && index != null) {
      openStepInspectorPopup(
        activeDocumentId,
        index,
        stepInspectorPopupRef
      );
    }
  }

  useEffect(() => {
    if (!isHydrated || selectedRowIndex == null) return;
    openStepInspectorPopup(
      activeDocumentId,
      selectedRowIndex,
      stepInspectorPopupRef
    );
  }, [isHydrated, activeDocumentId, selectedRowIndex]);

  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (!isStepInspectorMessage(event.data)) return;
      if (
        event.data.type === "select-revert" &&
        event.data.rowIndex != null
      ) {
        setSelectedRowIndex(event.data.rowIndex);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="h-dvh w-dvw bg-stone-100 text-stone-900 lg:flex lg:flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Shippori Mincho', serif; }
        .font-jp { font-family: 'Noto Sans JP', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>

      <Toolbar
        themeKey={themeKey}
        onThemeChange={setThemeKey}
        onShowFileList={() => setShowFileList(true)}
        onShowHelp={() => setShowHelp(true)}
        showStepBlockCaptions={showStepBlockCaptions}
        onShowStepBlockCaptionsChange={setShowStepBlockCaptions}
        mergeAtPreviousBlock={mergeAtPreviousBlock}
        onMergeAtPreviousBlockChange={setMergeAtPreviousBlock}
        guiActions={<ToolbarTemplateActions />}
      />

      <div className="flex-1 w-full mx-auto grid grid-cols-1 lg:flex lg:flex-row min-h-0">
        <div className="h-full bg-stone-100 p-4 sm:p-6 overflow-auto lg:flex-1 min-h-0">
          <div
            className="rounded-sm shadow-lg border border-stone-300 overflow-hidden"
            style={{ background: theme.bg }}
          >
            <Diagram
              model={guiModel}
              theme={theme}
              showStepBlockCaptions={showStepBlockCaptions}
              mergeAtPreviousBlock={mergeAtPreviousBlock}
              interactive
              selectedRowIndex={selectedRowIndex}
              onRowSelect={handleSelectRow}
            />
          </div>
          <div className="mt-3 font-jp text-[11px] text-stone-500 flex justify-between gap-2">
            <span>プレビュー · Preview</span>
            <span className="truncate text-right">{model.title}</span>
          </div>
        </div>

        <div className="h-full max-w-none lg:max-w-[600px] w-full lg:w-1/2 border-t lg:border-t-0 lg:border-r border-stone-300 bg-stone-900 text-stone-100 flex flex-col min-h-[calc(100vh-73px)]">
          <DocumentTabs
            className="border-stone-700/60 shrink-0"
            openDocuments={openDocuments}
            activeDocumentId={activeDocumentId}
            onSelectDocument={setActiveDocumentId}
            onCloseDocument={closeDocumentTab}
            onAddDocument={addDocumentTab}
          />
          <div className="flex flex-col min-h-0 flex-1">
            <div className="relative z-20 px-3 sm:px-4 py-2 border-b border-stone-700/60 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 shrink-0">
              <div className="flex items-center gap-1 font-mono text-[10px] text-stone-500 min-w-0 basis-full sm:basis-auto">
                <span>{guiModel.lanes.length} roles</span>
                <span className="text-stone-700">·</span>
                <span>{blockCount} blocks</span>
                <span className="text-stone-700">·</span>
                <span>{stepCount} steps</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 ml-auto">
                <ExportMenu src={src} modelTitle={model.title} themeBg={theme.bg} />
                <button
                  type="button"
                  onClick={saveDocuments}
                  className={`flex items-center gap-1.5 text-xs font-jp px-3 py-2 border rounded-sm transition ${
                    hasUnsavedChanges
                      ? "border-amber-500 text-amber-300 bg-amber-950/40 hover:bg-amber-900/40"
                      : "border-stone-700 text-stone-300 hover:bg-stone-800"
                  }`}
                >
                  <Save size={14} /> {hasUnsavedChanges ? "保存*" : "保存"}
                </button>
              </div>
            </div>
            <TitleField title={model.title} onChange={handleTitleChange} />
            <FlowStepList
              rows={guiModel.rows}
              selectedRowIndex={selectedRowIndex}
              onSelectRow={handleSelectRow}
              onEditRows={onEditRows}
              lanes={guiModel.lanes}
            />
            {model.errors?.length > 0 && (
              <div className="border-t border-red-900/50 bg-red-950/30 p-3 max-h-48 overflow-auto shrink-0">
                <div className="font-mono text-[10px] text-red-400 uppercase tracking-wider mb-1.5">
                  解析エラー
                </div>
                {model.errors.map((err, i) => (
                  <div key={i} className="font-mono text-xs text-red-300">
                    L{err.line}: {err.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showHelp && (
        <HelpModal
          helpMd={helpMd}
          templateMd={templateMd}
          themeKey={themeKey}
          onClose={() => setShowHelp(false)}
        />
      )}
      {showFileList && (
        <FileListModal
          documents={documents}
          activeDocumentId={activeDocumentId}
          onSelectDocument={(documentId) => {
            setOpenDocumentIds((currentOpenIds) =>
              currentOpenIds.includes(documentId)
                ? currentOpenIds
                : [...currentOpenIds, documentId]
            );
            setActiveDocumentId(documentId);
            setShowFileList(false);
          }}
          onDeleteDocument={deleteDocumentFromStorage}
          onImportDocument={(nextSrc, preferredName) => {
            importDocumentFromSrc(nextSrc, preferredName);
            setShowFileList(false);
          }}
          onClose={() => setShowFileList(false)}
        />
      )}
    </div>
  );
}
