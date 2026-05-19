import { useEffect, useMemo, useState } from "react";
import { EditorContext } from "./editor-context-state.js";
import SAMPLE from "../sample.txt?raw";
import HELP_MD from "../help.md?raw";
import TEMPLATE_MD from "../template.md?raw";
import DEFAULT_TAB_TEMPLATE from "../default-tab-template.txt?raw";
import { parseDSL, THEMES } from "@kai-swimlane/core";

const STORAGE_KEY = "swimlane-editor-state-v1";

function createDocument(id, name, src) {
  return { id, name, src, savedSrc: src };
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
  const [showHelp, setShowHelp] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydrate
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.documents) && parsed.documents.length > 0) {
        const restoredDocuments = parsed.documents.map((doc, index) => ({
          id: doc.id || `doc-${index + 1}`,
          name: doc.name || `Document ${index + 1}`,
          src: typeof doc.src === "string" ? doc.src : "",
          savedSrc:
            typeof doc.savedSrc === "string"
              ? doc.savedSrc
              : typeof doc.src === "string"
                ? doc.src
                : "",
        }));
        setDocuments(restoredDocuments);
        const restoredIds = restoredDocuments.map((document) => document.id);
        const restoredOpenIds =
          Array.isArray(parsed.openDocumentIds) && parsed.openDocumentIds.length > 0
            ? parsed.openDocumentIds.filter((id) => restoredIds.includes(id))
            : restoredIds;
        const normalizedOpenIds =
          restoredOpenIds.length > 0 ? restoredOpenIds : [restoredDocuments[0].id];

        setOpenDocumentIds(normalizedOpenIds);
        setActiveDocumentId(
          normalizedOpenIds.includes(parsed.activeDocumentId)
            ? parsed.activeDocumentId
            : normalizedOpenIds[0]
        );
      }
      if (typeof parsed.themeKey === "string" && THEMES[parsed.themeKey]) {
        setThemeKey(parsed.themeKey);
      }
      if (typeof parsed.showStepBlockCaptions === "boolean") {
        setShowStepBlockCaptions(parsed.showStepBlockCaptions);
      }
      if (typeof parsed.mergeAtPreviousBlock === "boolean") {
        setMergeAtPreviousBlock(parsed.mergeAtPreviousBlock);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const openDocuments = openDocumentIds
    .map((id) => documents.find((document) => document.id === id))
    .filter(Boolean);
  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) ||
    openDocuments[0];
  const src = activeDocument?.src || "";

  const theme = THEMES[themeKey];
  const model = useMemo(() => parseDSL(src), [src]);
  const hasUnsavedChanges = documents.some(
    (document) => document.src !== document.savedSrc
  );

  useEffect(() => {
    if (!isHydrated) return;

    const payload = {
      documents: documents.map(({ id, name, src: docSrc, savedSrc }) => ({
        id,
        name,
        src: docSrc,
        savedSrc,
      })),
      openDocumentIds,
      activeDocumentId,
      themeKey,
      showStepBlockCaptions,
      mergeAtPreviousBlock,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    documents,
    openDocumentIds,
    activeDocumentId,
    themeKey,
    showStepBlockCaptions,
    mergeAtPreviousBlock,
    isHydrated,
  ]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function updateActiveDocumentSrc(nextSrc) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === activeDocumentId
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
    showHelp,
    setShowHelp,
    showFileList,
    setShowFileList,
    isHydrated,
    src,
    model,
    hasUnsavedChanges,
    updateActiveDocumentSrc,
    replaceActiveDocumentSrc,
    saveDocuments,
    addDocumentTab,
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
