import { useEffect, useMemo, useRef, useState } from "react";
import { Diagram } from "@kai-swimlane/core";
import { Toolbar } from "../components/toolbar";
import { DocumentTabs } from "../components/document-tabs";
import { HelpModal } from "../components/help-modal";
import { FileListModal } from "../components/file-list-modal";
import { useEditor } from "../hooks/use-editor";
import { applyModelEdit, parseGuiModel } from "../lib/gui-model";
import { TitleField } from "../components/gui/title-field";
import { FlowStepList } from "../components/gui/flow-step-list";
import { ToolbarTemplateActions } from "../components/toolbar-template-actions";
import { openStepInspectorPopup } from "../lib/open-step-inspector-popup";

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
    documents,
    helpMd,
    templateMd,
    isHydrated,
  } = editor;

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const stepInspectorPopupRef = useRef(null);

  const guiModel = useMemo(() => parseGuiModel(src), [src]);

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

  return (
    <div className="h-dvh w-dvw bg-stone-100 text-stone-900 flex flex-col">
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

      <DocumentTabs
        className="border-stone-300 bg-stone-50 text-stone-800"
        openDocuments={openDocuments}
        activeDocumentId={activeDocumentId}
        onSelectDocument={setActiveDocumentId}
        onCloseDocument={closeDocumentTab}
        onAddDocument={addDocumentTab}
      />

      <div className="flex-1 flex min-h-0">
        <div className="w-[55%] min-w-0 p-4 overflow-auto bg-stone-100">
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
        </div>

        <div className="w-[45%] min-w-0 flex flex-col bg-stone-900 text-stone-100 border-l border-stone-300">
          <TitleField title={model.title} onChange={handleTitleChange} />
          <FlowStepList
            rows={guiModel.rows}
            selectedRowIndex={selectedRowIndex}
            onSelectRow={handleSelectRow}
            onEditRows={onEditRows}
            lanes={guiModel.lanes}
          />
          {model.errors?.length > 0 && (
            <div className="px-3 py-2 border-t border-red-900/50 bg-red-950/40 text-[10px] font-mono text-red-300 max-h-24 overflow-y-auto shrink-0">
              {model.errors.map((err, i) => (
                <p key={i}>
                  L{err.line}: {err.msg}
                </p>
              ))}
            </div>
          )}
          {hasUnsavedChanges && (
            <div className="px-3 py-2 border-t border-stone-700 flex justify-end shrink-0">
              <button
                type="button"
                onClick={saveDocuments}
                className="text-xs font-jp px-3 py-1.5 bg-stone-100 text-stone-900 rounded-sm hover:bg-white"
              >
                保存
              </button>
            </div>
          )}
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
          onClose={() => setShowFileList(false)}
        />
      )}
    </div>
  );
}
