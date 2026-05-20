import { Diagram } from "@kai-swimlane/core";
import { EditorPanel } from "../components/editor-panel";
import { Toolbar } from "../components/toolbar";
import { HelpModal } from "../components/help-modal";
import { FileListModal } from "../components/file-list-modal";
import { DocumentTabs } from "../components/document-tabs";
import { useEditor } from "../hooks/use-editor";

export function EditorPage() {
  const {
    openDocuments,
    activeDocumentId,
    setActiveDocumentId,
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
    setOpenDocumentIds,
    helpMd,
    templateMd,
  } = useEditor();

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
      />

      <div className="flex-1 w-full mx-auto grid grid-cols-1 lg:flex lg:flex-row">
        <div className="h-full bg-stone-100 p-6 overflow-auto lg:flex-1">
          <div
            className="rounded-sm shadow-lg border border-stone-300 overflow-hidden"
            style={{ background: theme.bg }}
          >
            <Diagram
              model={model}
              theme={theme}
              showStepBlockCaptions={showStepBlockCaptions}
              mergeAtPreviousBlock={mergeAtPreviousBlock}
            />
          </div>
          <div className="mt-3 font-jp text-[11px] text-stone-500 flex justify-between">
            <span>プレビュー · Preview</span>
            <span>{model.title}</span>
          </div>
        </div>

        <div className="h-full max-w-none lg:max-w-[600px] w-full lg:w-1/2 border-r border-stone-300 bg-stone-900 text-stone-100 flex flex-col min-h-[calc(100vh-73px)]">
          <DocumentTabs
            className="border-stone-700/60"
            openDocuments={openDocuments}
            activeDocumentId={activeDocumentId}
            onSelectDocument={setActiveDocumentId}
            onCloseDocument={closeDocumentTab}
            onAddDocument={addDocumentTab}
          />
          <EditorPanel
            src={src}
            onChange={updateActiveDocumentSrc}
            model={model}
            modelTitle={model.title}
            themeBg={theme.bg}
            hasUnsavedChanges={hasUnsavedChanges}
            onSave={saveDocuments}
          />
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
