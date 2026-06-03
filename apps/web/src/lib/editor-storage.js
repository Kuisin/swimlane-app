import { THEMES } from "@kai-swimlane/core";

export const STORAGE_KEY = "swimlane-editor-state-v1";

/** Persist live `src` for cross-window sync; `savedSrc` is used on full page reload. */
export function serializeEditorStateForStorage(state) {
  const {
    documents,
    openDocumentIds,
    activeDocumentId,
    themeKey,
    showStepBlockCaptions,
    mergeAtPreviousBlock,
    showLeftGutter,
  } = state;

  return JSON.stringify({
    documents: documents.map(({ id, name, src, savedSrc, revision }) => ({
      id,
      name,
      src,
      savedSrc,
      revision: revision ?? 0,
    })),
    openDocumentIds,
    activeDocumentId,
    themeKey,
    showStepBlockCaptions,
    mergeAtPreviousBlock,
    showLeftGutter,
  });
}

export function parseStoredEditorState(raw, { useLiveSrc = false } = {}) {
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
        const liveSrc =
          typeof doc.src === "string" ? doc.src : savedSrc;
        return {
          id: doc.id || `doc-${index + 1}`,
          name: doc.name || `Document ${index + 1}`,
          src: useLiveSrc ? liveSrc : savedSrc,
          savedSrc,
          revision: typeof doc.revision === "number" ? doc.revision : 0,
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
  if (typeof parsed.showLeftGutter === "boolean") {
    result.showLeftGutter = parsed.showLeftGutter;
  }

    return result;
  } catch {
    return null;
  }
}

/** Merge remote editor state without clobbering newer in-memory edits. */
export function mergeStoredDocuments(current, incoming) {
  return incoming.map((doc) => {
    const existing = current.find((entry) => entry.id === doc.id);
    if (!existing) {
      return { ...doc, parseErrorPolicy: null };
    }

    if (
      existing.src === doc.src &&
      existing.savedSrc === doc.savedSrc &&
      existing.name === doc.name &&
      (existing.revision ?? 0) === (doc.revision ?? 0)
    ) {
      return existing;
    }

    const incomingRevision = doc.revision ?? 0;
    const localRevision = existing.revision ?? 0;
    if (localRevision > incomingRevision) {
      return existing;
    }

    return { ...doc, parseErrorPolicy: existing.parseErrorPolicy };
  });
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
  if (typeof parsed.showLeftGutter === "boolean") {
    setShowLeftGutter(parsed.showLeftGutter);
  }
}
