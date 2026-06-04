import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import HELP_MD from "@kai-swimlane/content/help.md?raw";
import TEMPLATE_MD from "@kai-swimlane/content/template.md?raw";
import DEFAULT_TAB_TEMPLATE from "@kai-swimlane/content/default-tab-template.txt?raw";
import { parseDSL, THEMES } from "@kai-swimlane/core";
import { EditorContext } from "@web/context/editor-context";

const FolderContext = createContext(null);

function createDocument(relPath, content) {
  const parts = relPath.split("/");
  const fileName = parts[parts.length - 1] || relPath;
  const displayName = fileName.replace(/^\d+[_\-\s]/, "").replace(/\.txt$/i, "");
  const { errors } = parseDSL(content);
  return {
    id: relPath,
    name: displayName,
    src: content,
    savedSrc: content,
    // GUI-only desktop app: no text editor route — allow editing non-error rows immediately.
    parseErrorPolicy: errors.length > 0 ? "continue" : null,
    revision: 0,
  };
}

function noop() {}

export function FileEditorProvider({ children }) {
  const [documents, setDocuments] = useState([]);
  const [openDocumentIds, setOpenDocumentIds] = useState([]);
  const [activeDocumentId, setActiveDocumentIdState] = useState(null);
  const [themeKey, setThemeKey] = useState("basic");
  const [folderPath, setFolderPath] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showFileList, setShowFileList] = useState(false);
  const [isHydrated, setIsHydrated] = useState(true);

  const openDocuments = openDocumentIds
    .map((id) => documents.find((doc) => doc.id === id))
    .filter(Boolean);

  const activeDocument =
    documents.find((doc) => doc.id === activeDocumentId) || openDocuments[0];

  const src = activeDocument?.src || "";
  const theme = THEMES[themeKey];
  const model = useMemo(() => parseDSL(src), [src]);
  const activeParseErrorPolicy = activeDocument?.parseErrorPolicy ?? null;

  if (model.errors.length === 0 && documents.some((doc) => doc.parseErrorPolicy)) {
    setDocuments((current) =>
      current.map((doc) =>
        doc.parseErrorPolicy ? { ...doc, parseErrorPolicy: null } : doc,
      ),
    );
  }

  const hasUnsavedChanges = documents.some((doc) => doc.src !== doc.savedSrc);
  const activeDocumentIdRef = useRef(activeDocumentId);

  useEffect(() => {
    activeDocumentIdRef.current = activeDocumentId;
  }, [activeDocumentId]);

  function setActiveDocumentParseErrorPolicy(policy) {
    if (!activeDocumentId) return;
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === activeDocumentId ? { ...doc, parseErrorPolicy: policy } : doc,
      ),
    );
  }

  function updateDocumentSrc(documentId, nextSrc) {
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === documentId
          ? { ...doc, src: nextSrc, revision: (doc.revision ?? 0) + 1 }
          : doc,
      ),
    );
  }

  function updateActiveDocumentSrc(nextSrc) {
    if (!activeDocumentId) return;
    updateDocumentSrc(activeDocumentId, nextSrc);
  }

  function replaceActiveDocumentSrc(nextSrc) {
    if (!activeDocumentId) return;
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === activeDocumentId
          ? {
              ...doc,
              src: nextSrc,
              savedSrc: nextSrc,
              revision: (doc.revision ?? 0) + 1,
            }
          : doc,
      ),
    );
  }

  async function saveDocuments() {
    if (!activeDocumentId || !activeDocument) return;
    if (activeDocument.src === activeDocument.savedSrc) return;
    await window.api.writeTxtFile(activeDocumentId, activeDocument.src);
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === activeDocumentId ? { ...doc, savedSrc: doc.src } : doc,
      ),
    );
  }

  const loadFolder = useCallback(async (path, fileList) => {
    window.api.removeFileChangedListener();
    window.api.stopWatch();

    const docs = fileList.map((file) => createDocument(file.name, file.content));
    const ids = docs.map((doc) => doc.id).sort();

    setFolderPath(path);
    setDocuments(docs);
    setOpenDocumentIds(ids);
    setActiveDocumentIdState(ids[0] ?? null);
    setIsHydrated(true);

    if (ids.length > 0) {
      window.api.watchFolder(path);
      window.api.onFileChanged(({ name, content, eventType }) => {
        if (eventType === "unlink") {
          setDocuments((current) => current.filter((doc) => doc.id !== name));
          setOpenDocumentIds((current) => {
            const next = current.filter((id) => id !== name);
            setActiveDocumentIdState((currentId) =>
              currentId === name ? (next[0] ?? null) : currentId,
            );
            return next;
          });
          return;
        }

        const currentActiveId = activeDocumentIdRef.current;
        setDocuments((current) => {
          const existing = current.find((doc) => doc.id === name);
          if (
            existing &&
            existing.src !== existing.savedSrc &&
            name === currentActiveId
          ) {
            return current;
          }
          if (existing) {
            return current.map((doc) =>
              doc.id === name
                ? {
                    ...doc,
                    src: content,
                    savedSrc: content,
                    revision: (doc.revision ?? 0) + 1,
                  }
                : doc,
            );
          }
          return [...current, createDocument(name, content)];
        });

        setOpenDocumentIds((current) =>
          current.includes(name) ? current : [...current, name].sort(),
        );
      });
    }
  }, []);

  async function openFolder() {
    const path = await window.api.selectFolder();
    if (!path) return;
    const files = await window.api.readTxtFiles(path);
    await loadFolder(path, files);
  }

  async function openSamples() {
    const { folderPath: path, files } = await window.api.readBundledSamples();
    await loadFolder(path, files);
  }

  function setActiveDocumentId(documentId) {
    const doc = documents.find((d) => d.id === documentId);
    if (doc && doc.src !== doc.savedSrc && documentId !== activeDocumentId) {
      const ok = window.confirm(
        "未保存の変更があります。ファイルを切り替えますか？（変更は破棄されます）",
      );
      if (!ok) return;
      setDocuments((current) =>
        current.map((d) =>
          d.id === activeDocumentId ? { ...d, src: d.savedSrc } : d,
        ),
      );
    }
    setActiveDocumentIdState(documentId);
  }

  const editorValue = {
    documents,
    openDocuments,
    openDocumentIds,
    setOpenDocumentIds,
    activeDocumentId,
    setActiveDocumentId,
    themeKey,
    setThemeKey,
    theme,
    showStepBlockCaptions: true,
    setShowStepBlockCaptions: noop,
    mergeAtPreviousBlock: true,
    setMergeAtPreviousBlock: noop,
    showLeftGutter: true,
    setShowLeftGutter: noop,
    showHelp,
    setShowHelp,
    showFileList,
    setShowFileList,
    showOptions,
    setShowOptions,
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
    addDocumentTab: noop,
    importDocumentFromSrc: noop,
    closeDocumentTab: noop,
    deleteDocumentFromStorage: noop,
    helpMd: HELP_MD,
    templateMd: TEMPLATE_MD,
    defaultTabTemplate: DEFAULT_TAB_TEMPLATE,
  };

  const folderValue = {
    folderPath,
    openFolder,
    openSamples,
    loadFolder,
  };

  return (
    <FolderContext.Provider value={folderValue}>
      <EditorContext.Provider value={editorValue}>{children}</EditorContext.Provider>
    </FolderContext.Provider>
  );
}

export function useFolder() {
  const ctx = useContext(FolderContext);
  if (!ctx) {
    throw new Error("useFolder must be used within FileEditorProvider");
  }
  return ctx;
}

export { EditorContext };
