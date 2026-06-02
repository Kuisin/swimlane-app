import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContext } from "./editor-context";
import SAMPLE from "../content/sample.txt?raw";
import HELP_MD from "../content/help.md?raw";
import TEMPLATE_MD from "../content/template.md?raw";
import DEFAULT_TAB_TEMPLATE from "../content/default-tab-template.txt?raw";
import { parseDSL, THEMES } from "@kai-swimlane/core";
import {
  STORAGE_KEY,
  parseStoredEditorState,
  applyStoredEditorState,
  serializeEditorStateForStorage,
} from "../lib/editor-storage";
import { extractDocumentTitle } from "../lib/document-title";

function createDocument(id, name, src) {
  return { id, name, src, savedSrc: src, parseErrorPolicy: null };
}

function createNextDocumentName(documents) {
  return `Document ${documents.length + 1}`;
}

function createDocumentId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function EditorProvider({ children }) {
  const [documents, setDocuments] = useState([
    createDocument("doc-1", "Document 1", SAMPLE),
  ]);
  const [openDocumentIds, setOpenDocumentIds] = useState(["doc-1"]);
  const [activeDocumentId, setActiveDocumentId] = useState("doc-1");
  const [themeKey, setThemeKey] = useState("basic");
  const [showStepBlockCaptions, setShowStepBlockCaptions] = useState(true);
  const [mergeAtPreviousBlock, setMergeAtPreviousBlock] = useState(true);
  const [showRightRemarks, setShowRightRemarks] = useState(true);
  const [showLeftRemarks, setShowLeftRemarks] = useState(true);
  const [showLeftGutter, setShowLeftGutter] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = parseStoredEditorState(raw);
    if (parsed) {
      applyStoredEditorState(parsed, {
        setDocuments,
        setOpenDocumentIds,
        setActiveDocumentId,
        setThemeKey,
        setShowStepBlockCaptions,
        setMergeAtPreviousBlock,
        setShowRightRemarks,
        setShowLeftRemarks,
        setShowLeftGutter,
      });
    } else if (raw) {
      localStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydrate
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    function handleStorage(event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      const parsed = parseStoredEditorState(event.newValue);
      if (!parsed) return;
      applyStoredEditorState(parsed, {
        setDocuments,
        setOpenDocumentIds,
        setActiveDocumentId,
        setThemeKey,
        setShowStepBlockCaptions,
        setMergeAtPreviousBlock,
        setShowRightRemarks,
        setShowLeftRemarks,
        setShowLeftGutter,
      });
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isHydrated]);

  const openDocuments = openDocumentIds
    .map((id) => documents.find((document) => document.id === id))
    .filter(Boolean);
  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ||
    openDocuments[0];
  const src = activeDocument?.src || "";

  const theme = THEMES[themeKey];
  const model = useMemo(() => parseDSL(src), [src]);
  const activeParseErrorPolicy = activeDocument?.parseErrorPolicy ?? null;

  // When parse errors clear, drop any stale per-document parse-error policy so a
  // later error re-prompts. Done during render (React's "adjust state while
  // rendering" pattern) instead of in an effect, and guarded so it only runs
  // when something actually needs clearing — which also avoids a render loop.
  if (model.errors.length === 0 && documents.some((doc) => doc.parseErrorPolicy)) {
    setDocuments((current) =>
      current.map((doc) =>
        doc.parseErrorPolicy ? { ...doc, parseErrorPolicy: null } : doc,
      ),
    );
  }

  function setActiveDocumentParseErrorPolicy(policy) {
    if (!activeDocumentId) return;
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === activeDocumentId ? { ...doc, parseErrorPolicy: policy } : doc,
      ),
    );
  }

  const hasUnsavedChanges = documents.some(
    (document) => document.src !== document.savedSrc
  );

  const persistSnapshotRef = useRef({
    documents,
    openDocumentIds,
    activeDocumentId,
    themeKey,
    showStepBlockCaptions,
    mergeAtPreviousBlock,
    showRightRemarks,
    showLeftRemarks,
    showLeftGutter,
  });
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    persistSnapshotRef.current = {
      documents,
      openDocumentIds,
      activeDocumentId,
      themeKey,
      showStepBlockCaptions,
      mergeAtPreviousBlock,
      showRightRemarks,
      showLeftRemarks,
      showLeftGutter,
    };
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [
    documents,
    openDocumentIds,
    activeDocumentId,
    themeKey,
    showStepBlockCaptions,
    mergeAtPreviousBlock,
    showRightRemarks,
    showLeftRemarks,
    showLeftGutter,
    hasUnsavedChanges,
  ]);

  function flushSavedStateToStorage() {
    localStorage.setItem(
      STORAGE_KEY,
      serializeEditorStateForStorage(persistSnapshotRef.current),
    );
  }

  useEffect(() => {
    if (!isHydrated) return;
    flushSavedStateToStorage();
  }, [
    documents,
    openDocumentIds,
    activeDocumentId,
    themeKey,
    showStepBlockCaptions,
    mergeAtPreviousBlock,
    showRightRemarks,
    showLeftRemarks,
    showLeftGutter,
    isHydrated,
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    if (window.location.pathname === `${base}/gui/step-inspector`) return;

    function handleUnload() {
      if (!hasUnsavedChangesRef.current) return;
      flushSavedStateToStorage();
    }

    function handleBeforeUnload(event) {
      if (!hasUnsavedChangesRef.current) return;
      flushSavedStateToStorage();
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [hasUnsavedChanges]);

  function updateActiveDocumentSrc(nextSrc) {
    updateDocumentSrc(activeDocumentId, nextSrc);
  }

  function updateDocumentSrc(documentId, nextSrc) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === documentId
          ? { ...document, src: nextSrc }
          : document
      )
    );
  }

  function replaceActiveDocumentSrc(nextSrc) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === activeDocumentId
          ? { ...document, src: nextSrc, savedSrc: nextSrc }
          : document
      )
    );
  }

  function saveDocuments() {
    const nextDocuments = documents.map((document) => ({
      ...document,
      savedSrc: document.src,
    }));
    setDocuments(nextDocuments);
  }

  function addDocumentTab() {
    const id = createDocumentId();
    const name = createNextDocumentName(documents);
    const newDocument = createDocument(id, name, DEFAULT_TAB_TEMPLATE);
    setDocuments((currentDocuments) => [...currentDocuments, newDocument]);
    setOpenDocumentIds((currentOpenIds) => [...currentOpenIds, id]);
    setActiveDocumentId(id);
  }

  function importDocumentFromSrc(nextSrc, preferredName) {
    const id = createDocumentId();
    const fallbackName = createNextDocumentName(documents);
    const name =
      preferredName?.trim() || extractDocumentTitle(nextSrc, fallbackName);
    const newDocument = createDocument(id, name, nextSrc);
    setDocuments((currentDocuments) => [...currentDocuments, newDocument]);
    setOpenDocumentIds((currentOpenIds) => [...currentOpenIds, id]);
    setActiveDocumentId(id);
  }

  function closeDocumentTab(documentId) {
    setOpenDocumentIds((currentOpenIds) => {
      if (!currentOpenIds.includes(documentId)) return currentOpenIds;
      if (currentOpenIds.length === 1) return currentOpenIds;

      const closingIndex = currentOpenIds.findIndex((id) => id === documentId);
      const nextOpenIds = currentOpenIds.filter((id) => id !== documentId);

      if (documentId === activeDocumentId) {
        const nextIndex = Math.max(0, closingIndex - 1);
        setActiveDocumentId(nextOpenIds[nextIndex] || nextOpenIds[0]);
      }

      return nextOpenIds;
    });
  }

  function deleteDocumentFromStorage(documentId) {
    setDocuments((currentDocuments) => {
      if (currentDocuments.length === 1) {
        const blankDocument = createDocument(
          createDocumentId(),
          "Document 1",
          DEFAULT_TAB_TEMPLATE
        );
        setOpenDocumentIds([blankDocument.id]);
        setActiveDocumentId(blankDocument.id);
        return [blankDocument];
      }

      const nextDocuments = currentDocuments.filter(
        (document) => document.id !== documentId
      );
      const nextDocumentIds = nextDocuments.map((document) => document.id);

      setOpenDocumentIds((currentOpenIds) => {
        const filteredOpenIds = currentOpenIds.filter((id) => id !== documentId);
        if (filteredOpenIds.length > 0) return filteredOpenIds;
        return [nextDocumentIds[0]];
      });

      if (documentId === activeDocumentId) {
        setActiveDocumentId(nextDocumentIds[0]);
      }

      return nextDocuments;
    });
  }

  const value = {
    documents,
    openDocuments,
    openDocumentIds,
    setOpenDocumentIds,
    activeDocumentId,
    setActiveDocumentId,
    themeKey,
    setThemeKey,
    theme,
    showStepBlockCaptions,
    setShowStepBlockCaptions,
    mergeAtPreviousBlock,
    setMergeAtPreviousBlock,
    showRightRemarks,
    setShowRightRemarks,
    showLeftRemarks,
    setShowLeftRemarks,
    showLeftGutter,
    setShowLeftGutter,
    showHelp,
    setShowHelp,
    showFileList,
    setShowFileList,
    isHydrated,
    src,
    model,
    activeParseErrorPolicy,
    setActiveDocumentParseErrorPolicy,
    hasUnsavedChanges,
    updateActiveDocumentSrc,
    updateDocumentSrc,
    replaceActiveDocumentSrc,
    saveDocuments,
    addDocumentTab,
    importDocumentFromSrc,
    closeDocumentTab,
    deleteDocumentFromStorage,
    helpMd: HELP_MD,
    templateMd: TEMPLATE_MD,
    defaultTabTemplate: DEFAULT_TAB_TEMPLATE,
  };

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}
