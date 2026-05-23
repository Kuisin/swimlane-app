import { EditorLayout } from "../components/editor/layout";
import { TextModePanel } from "../components/text-mode/panel";
import { useEditor } from "../hooks/use-editor";

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

  return (
    <EditorLayout diagramModel={model}>
      <TextModePanel
        src={src}
        onChange={updateActiveDocumentSrc}
        model={model}
        modelTitle={model.title}
        themeBg={theme.bg}
        showStepBlockCaptions={showStepBlockCaptions}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveDocuments}
      />
    </EditorLayout>
  );
}
