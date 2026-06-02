import { EditorLayout } from "../components/editor/layout";
import { TextModePanel } from "../components/text-mode/panel";
import { useEditor } from "../hooks/use-editor";
import { resolveDiagramOptions } from "@kai-swimlane/core";

export function EditorPage() {
  const {
    theme,
    showStepBlockCaptions,
    src,
    model,
    hasUnsavedChanges,
    updateActiveDocumentSrc,
    saveDocuments,
  } = useEditor();
  const resolvedDiagramOptions = resolveDiagramOptions(model.options, {
    showStepBlockCaptions,
  });

  return (
    <EditorLayout diagramModel={model}>
      <TextModePanel
        src={src}
        onChange={updateActiveDocumentSrc}
        model={model}
        modelTitle={model.title}
        themeBg={theme.bg}
        showStepBlockCaptions={resolvedDiagramOptions.showStepBlockCaptions}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveDocuments}
      />
    </EditorLayout>
  );
}
