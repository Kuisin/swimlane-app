import { useEffect, useMemo, useRef, useState } from "react";
import { EditorLayout } from "../components/editor/layout";
import { GuiModePanel } from "../components/gui/panel";
import { useEditor } from "../hooks/use-editor";
import { applyModelEdit, parseGuiModel } from "../lib/gui-model";
import { resolveDiagramOptions } from "@kai-swimlane/core";
import {
  openStepInspectorPopup,
  syncStepInspectorPopup,
} from "../lib/open-step-inspector-popup";
import { isStepInspectorMessage } from "../lib/step-inspector-channel";

export function GuiPage() {
  const {
    activeDocumentId,
    theme,
    src,
    model,
    hasUnsavedChanges,
    updateActiveDocumentSrc,
    saveDocuments,
    isHydrated,
  } = useEditor();

  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const stepInspectorPopupRef = useRef(null);

  const guiModel = useMemo(() => parseGuiModel(src), [src]);
  const resolvedDiagramOptions = useMemo(
    () => resolveDiagramOptions(guiModel.options),
    [guiModel.options],
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
    setSelectedRowIndex(index);
    if (isHydrated && index != null) {
      openStepInspectorPopup(activeDocumentId, index, stepInspectorPopupRef);
    }
  }

  useEffect(() => {
    if (!isHydrated || selectedRowIndex == null) return;
    syncStepInspectorPopup(
      activeDocumentId,
      selectedRowIndex,
      stepInspectorPopupRef
    );
  }, [isHydrated, activeDocumentId, selectedRowIndex]);

  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (!isStepInspectorMessage(event.data)) return;
      if (event.data.type === "select-revert" && event.data.rowIndex != null) {
        setSelectedRowIndex(event.data.rowIndex);
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <EditorLayout
      diagramModel={guiModel}
      diagramExtras={{
        interactive: true,
        selectedRowIndex,
        onRowSelect: handleSelectRow,
      }}
    >
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
    </EditorLayout>
  );
}
