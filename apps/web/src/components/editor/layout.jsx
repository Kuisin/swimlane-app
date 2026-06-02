import { Diagram, resolveDiagramOptions } from "@kai-swimlane/core";
import { useEditor } from "../../hooks/use-editor";
import { applyModelEdit } from "../../lib/gui-model";
import { Toolbar } from "./shell/toolbar";
import { HelpModal } from "./shell/help-modal";
import { FileListModal } from "./shell/file-list-modal";
import { OptionsModal } from "./shell/options-modal";
import { DocumentTabs } from "./document-tabs";

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
  .font-display { font-family: 'Shippori Mincho', serif; }
  .font-jp { font-family: 'Noto Sans JP', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
`;

export function EditorLayout({
  diagramModel,
  diagramExtras = null,
  toolbarExtras = null,
  children,
}) {
  const {
    openDocuments,
    activeDocumentId,
    setActiveDocumentId,
    setOpenDocumentIds,
    themeKey,
    setThemeKey,
    theme,
    src,
    updateActiveDocumentSrc,
    showHelp,
    setShowHelp,
    showFileList,
    setShowFileList,
    showOptions,
    setShowOptions,
    addDocumentTab,
    closeDocumentTab,
    deleteDocumentFromStorage,
    importDocumentFromSrc,
    documents,
    helpMd,
    templateMd,
  } = useEditor();
  // Display options now live in the document's /option/ section only.
  const resolvedDiagramOptions = resolveDiagramOptions(diagramModel.options);
  const applyOption = (editFn) =>
    updateActiveDocumentSrc(applyModelEdit(src, editFn));

  return (
    <div className="h-dvh w-dvw bg-stone-100 text-stone-900 lg:flex lg:flex-col">
      <style>{FONT_STYLE}</style>

      <Toolbar
        themeKey={themeKey}
        onThemeChange={setThemeKey}
        onShowFileList={() => setShowFileList(true)}
        onShowHelp={() => setShowHelp(true)}
        guiActions={toolbarExtras}
      />

      <div className="flex-1 w-full mx-auto grid grid-cols-1 lg:flex lg:flex-row min-h-0">
        <div className="h-full bg-stone-100 p-4 sm:p-6 overflow-auto lg:flex-1 min-h-0">
          <div
            className="rounded-sm shadow-lg border border-stone-300 overflow-hidden"
            style={{ background: theme.bg }}
          >
            <Diagram
              model={diagramModel}
              theme={theme}
              showStepBlockCaptions={resolvedDiagramOptions.showStepBlockCaptions}
              mergeAtPreviousBlock={resolvedDiagramOptions.mergeAtPreviousBlock}
              showLeftGutter={resolvedDiagramOptions.showLeftGutter}
              showRightGutter={resolvedDiagramOptions.showRightGutter}
              showHeader={resolvedDiagramOptions.showHeader}
              showFooter={resolvedDiagramOptions.showFooter}
              {...(diagramExtras || {})}
            />
          </div>
          <div className="mt-3 font-jp text-[11px] text-stone-500 flex justify-between gap-2">
            <span>プレビュー · Preview</span>
            <span className="truncate text-right">{diagramModel.title}</span>
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
          <div className="flex flex-col min-h-0 flex-1">{children}</div>
        </div>
      </div>

      <OptionsModal
        open={showOptions}
        model={diagramModel}
        onApply={applyOption}
        onClose={() => setShowOptions(false)}
      />
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
