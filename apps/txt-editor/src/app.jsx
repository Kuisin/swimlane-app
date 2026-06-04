import { useEffect, useMemo, useState } from "react";
import { Diagram, resolveDiagramOptions } from "@kai-swimlane/core";
import { useEditor } from "@web/hooks/use-editor";
import { applyModelEdit, parseGuiModel } from "@web/lib/gui-model";
import { GuiModePanel } from "@web/components/gui/panel";
import { HelpModal } from "@web/components/editor/shell/help-modal";
import { OptionsModal } from "@web/components/editor/shell/options-modal";
import { useFolder } from "./context/file-editor-provider";
import { AppToolbar } from "./components/app-toolbar";
import { FolderSidebar } from "./components/folder-sidebar";
import { StepInspectorPanel } from "./components/step-inspector-panel";
import { TemplateModal } from "./components/template-modal";
import { TemplateModalProvider } from "./shims/toolbar-template-actions";

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
  .font-display { font-family: 'Noto Sans JP', 'Noto Sans', sans-serif; }
  .font-jp { font-family: 'Noto Sans JP', 'Noto Sans', sans-serif; }
  .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
`;

export function App() {
  const { folderPath, openFolder, openSamples } = useFolder();
  const {
    documents,
    openDocumentIds,
    activeDocumentId,
    setActiveDocumentId,
    theme,
    themeKey,
    src,
    model,
    hasUnsavedChanges,
    updateActiveDocumentSrc,
    saveDocuments,
    showHelp,
    setShowHelp,
    showOptions,
    setShowOptions,
    helpMd,
    templateMd,
  } = useEditor();

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [templateKind, setTemplateKind] = useState(null);
  const [inspectorDirty, setInspectorDirty] = useState(false);

  const guiModel = useMemo(() => parseGuiModel(src), [src]);
  const resolvedDiagramOptions = useMemo(
    () => resolveDiagramOptions(guiModel.options),
    [guiModel.options],
  );

  const dirtyIds = useMemo(
    () => new Set(documents.filter((doc) => doc.src !== doc.savedSrc).map((doc) => doc.id)),
    [documents],
  );

  function onEditRows(editFn) {
    updateActiveDocumentSrc(applyModelEdit(src, editFn));
  }

  function handleTitleChange(title) {
    onEditRows((draft) => {
      draft.title = title;
    });
  }

  function handleSelectRow(index) {
    if (inspectorDirty) {
      const ok = window.confirm("手順の詳細に未保存の変更があります。選択を変更しますか？");
      if (!ok) return;
    }
    setSelectedRowIndex(index);
  }

  function handleSelectFile(fileId) {
    if (inspectorDirty) {
      const ok = window.confirm("手順の詳細に未保存の変更があります。ファイルを切り替えますか？");
      if (!ok) return;
    }
    setSelectedRowIndex(null);
    setActiveDocumentId(fileId);
  }

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        saveDocuments();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveDocuments]);

  useEffect(() => {
    setSelectedRowIndex(null);
  }, [activeDocumentId]);

  if (!folderPath || openDocumentIds.length === 0) {
    return (
      <div className="h-full w-full bg-stone-100 text-stone-900 flex flex-col">
        <style>{FONT_STYLE}</style>
        <AppToolbar onShowHelp={() => setShowHelp(true)} />
        <EmptyState onOpenFolder={openFolder} onOpenSamples={openSamples} />
        {showHelp && (
          <HelpModal
            helpMd={helpMd}
            templateMd={templateMd}
            themeKey={themeKey}
            onClose={() => setShowHelp(false)}
          />
        )}
      </div>
    );
  }

  return (
    <TemplateModalProvider onOpenTemplate={setTemplateKind}>
    <div className="h-full w-full bg-stone-100 text-stone-900 flex flex-col">
      <style>{FONT_STYLE}</style>

      <AppToolbar onShowHelp={() => setShowHelp(true)} />

      <div className="flex-1 flex min-h-0 min-w-0 flex-col xl:flex-row">
        <FolderSidebar
          fileIds={openDocumentIds}
          activeId={activeDocumentId}
          onSelect={handleSelectFile}
          dirtyIds={dirtyIds}
          folderPath={folderPath}
        />

        <div className="flex-1 flex min-w-0 min-h-0 flex-col lg:flex-row">
          <div className="flex-1 min-w-0 min-h-[240px] p-4 sm:p-6 overflow-auto bg-stone-100">
            <div
              className="rounded-sm shadow-lg border border-stone-300 overflow-hidden"
              style={{ background: theme.bg }}
            >
              <Diagram
                model={guiModel}
                theme={theme}
                showStepBlockCaptions={resolvedDiagramOptions.showStepBlockCaptions}
                mergeAtPreviousBlock={resolvedDiagramOptions.mergeAtPreviousBlock}
                showLeftGutter={resolvedDiagramOptions.showLeftGutter}
                showRightGutter={resolvedDiagramOptions.showRightGutter}
                showHeader={resolvedDiagramOptions.showHeader}
                showFooter={resolvedDiagramOptions.showFooter}
                showDescription={resolvedDiagramOptions.showDescription}
                branchColorArrows={resolvedDiagramOptions.branchColorArrows}
                interactive
                selectedRowIndex={selectedRowIndex}
                onRowSelect={handleSelectRow}
              />
            </div>
            <div className="mt-3 font-jp text-[11px] text-stone-500 flex justify-between gap-2">
              <span>プレビュー · Preview</span>
              <span className="truncate text-right">{guiModel.title}</span>
            </div>
          </div>

          <div className="w-full lg:max-w-[560px] lg:w-[42%] shrink-0 border-t lg:border-t-0 lg:border-l border-stone-300 bg-stone-900 text-stone-100 flex flex-col min-h-[320px] lg:min-h-0">
            <div className="px-3 py-2 border-b border-stone-700/60 shrink-0">
              <p className="text-[10px] font-jp text-stone-500">編集中</p>
              <p className="text-xs font-mono text-stone-300 truncate" title={activeDocumentId}>
                {activeDocumentId}
                {hasUnsavedChanges ? " *" : ""}
              </p>
            </div>
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <GuiModePanel
                  src={src}
                  model={model}
                  guiModel={guiModel}
                  themeBg={theme.bg}
                  showStepBlockCaptions={resolvedDiagramOptions.showStepBlockCaptions}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onSave={saveDocuments}
                  onTitleChange={handleTitleChange}
                  selectedRowIndex={selectedRowIndex}
                  onSelectRow={handleSelectRow}
                  onEditRows={onEditRows}
                />
              </div>
              <StepInspectorPanel
                rowIndex={selectedRowIndex}
                onDirtyChange={setInspectorDirty}
              />
            </div>
          </div>
        </div>
      </div>

      <OptionsModal
        open={showOptions}
        model={guiModel}
        onApply={(editFn) => updateActiveDocumentSrc(applyModelEdit(src, editFn))}
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

      {templateKind && (
        <TemplateModal kind={templateKind} onClose={() => setTemplateKind(null)} />
      )}
    </div>
    </TemplateModalProvider>
  );
}

function EmptyState({ onOpenFolder, onOpenSamples }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">📂</div>
      <p className="font-jp text-stone-600 max-w-md">
        <strong>.txt</strong> スイムレーン DSL ファイルを含むフォルダを開いて編集を開始してください。
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={onOpenFolder}
          className="text-sm font-jp px-4 py-2 bg-stone-900 text-stone-50 rounded-sm hover:bg-stone-800 transition"
        >
          フォルダを開く
        </button>
        <button
          type="button"
          onClick={onOpenSamples}
          className="text-sm font-jp px-4 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
        >
          サンプルを開く
        </button>
      </div>
    </div>
  );
}
