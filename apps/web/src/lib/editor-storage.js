import { THEMES } from "@kai-swimlane/core";

export const STORAGE_KEY = "swimlane-editor-state-v1";

/** Persist only last-saved DSL so reload after leaving discards unsaved edits. */
export function serializeEditorStateForStorage(state) {
  const {
    documents,
    openDocumentIds,
    activeDocumentId,
    themeKey,
    showStepBlockCaptions,
    mergeAtPreviousBlock,
    showRightRemarks,
    showLeftRemarks,
    showLeftGutter,
  } = state;

  return JSON.stringify({
    documents: documents.map(({ id, name, savedSrc }) => ({
      id,
      name,
      src: savedSrc,
      savedSrc,
    })),
    openDocumentIds,
    activeDocumentId,
    themeKey,
    showStepBlockCaptions,
    mergeAtPreviousBlock,
    showRightRemarks,
    showLeftRemarks,
    showLeftGutter,
  });
}

export function parseStoredEditorState(raw) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const result = {};

    if (Array.isArray(parsed.documents) && parsed.documents.length > 0) {
      const restoredDocuments = parsed.documents.map((doc, index) => {
        const savedSrc =
          typeof doc.savedSrc === "string"
            ? doc.savedSrc
            : typeof doc.src === "string"
              ? doc.src
              : "";
        return {
          id: doc.id || `doc-${index + 1}`,
          name: doc.name || `Document ${index + 1}`,
          src: savedSrc,
          savedSrc,
          parseErrorPolicy: null,
        };
      });
      result.documents = restoredDocuments;
      const restoredIds = restoredDocuments.map((document) => document.id);
      const restoredOpenIds =
        Array.isArray(parsed.openDocumentIds) && parsed.openDocumentIds.length > 0
          ? parsed.openDocumentIds.filter((id) => restoredIds.includes(id))
          : restoredIds;
      result.openDocumentIds =
        restoredOpenIds.length > 0 ? restoredOpenIds : [restoredDocuments[0].id];
      result.activeDocumentId = result.openDocumentIds.includes(
        parsed.activeDocumentId
      )
        ? parsed.activeDocumentId
        : result.openDocumentIds[0];
    }

    if (typeof parsed.themeKey === "string" && THEMES[parsed.themeKey]) {
      result.themeKey = parsed.themeKey;
    }
    if (typeof parsed.showStepBlockCaptions === "boolean") {
      result.showStepBlockCaptions = parsed.showStepBlockCaptions;
    }
    if (typeof parsed.mergeAtPreviousBlock === "boolean") {
      result.mergeAtPreviousBlock = parsed.mergeAtPreviousBlock;
    }
  if (typeof parsed.showRightRemarks === "boolean") {
    result.showRightRemarks = parsed.showRightRemarks;
  }
  if (typeof parsed.showLeftRemarks === "boolean") {
    result.showLeftRemarks = parsed.showLeftRemarks;
  }
  if (typeof parsed.showLeftGutter === "boolean") {
    result.showLeftGutter = parsed.showLeftGutter;
  }

    return result;
  } catch {
    return null;
  }
}

export function applyStoredEditorState(parsed, setters) {
  if (!parsed) return;

  const {
    setDocuments,
    setOpenDocumentIds,
    setActiveDocumentId,
    setThemeKey,
    setShowStepBlockCaptions,
    setMergeAtPreviousBlock,
    setShowRightRemarks,
    setShowLeftRemarks,
    setShowLeftGutter,
  } = setters;

  if (parsed.documents) {
    setDocuments(parsed.documents);
    if (parsed.openDocumentIds) {
      setOpenDocumentIds(parsed.openDocumentIds);
    }
    if (parsed.activeDocumentId) {
      setActiveDocumentId(parsed.activeDocumentId);
    }
  }
  if (parsed.themeKey) setThemeKey(parsed.themeKey);
  if (typeof parsed.showStepBlockCaptions === "boolean") {
    setShowStepBlockCaptions(parsed.showStepBlockCaptions);
  }
  if (typeof parsed.mergeAtPreviousBlock === "boolean") {
    setMergeAtPreviousBlock(parsed.mergeAtPreviousBlock);
  }
  if (typeof parsed.showRightRemarks === "boolean") {
    setShowRightRemarks(parsed.showRightRemarks);
  }
  if (typeof parsed.showLeftRemarks === "boolean") {
    setShowLeftRemarks(parsed.showLeftRemarks);
  }
  if (typeof parsed.showLeftGutter === "boolean") {
    setShowLeftGutter(parsed.showLeftGutter);
  }
}
