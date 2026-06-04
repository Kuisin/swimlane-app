import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import HELP_MD from "@kai-swimlane/content/help.md?raw";
import TEMPLATE_MD from "@kai-swimlane/content/template.md?raw";
import DEFAULT_TAB_TEMPLATE from "@kai-swimlane/content/default-tab-template.txt?raw";
import { parseDSL, THEMES } from "@kai-swimlane/core";
import { EditorContext } from "./editor-context";
import {
  dslContentFromTemplate,
  isDocumentDirty,
  normalizeFileContent,
  normalizeNewTxtRelPath,
  suggestNewTxtFileName,
  syncDocumentFromDisk,
} from "../lib/dsl-document";
import { useAppDialog } from "./app-dialog-provider";
import { FolderContext } from "./folder-context";

function createDocument(relPath, content) {
  const parts = relPath.split("/");
  const fileName = parts[parts.length - 1] || relPath;
  const displayName = fileName.replace(/^\d+[_\-\s]/, "").replace(/\.txt$/i, "");
  const normalized = normalizeFileContent(relPath, content);
  return {
    id: relPath,
    name: displayName,
    src: normalized.src,
    savedSrc: normalized.savedSrc,
    parseErrorPolicy: normalized.parseErrorPolicy,
    initializedFromBlank: normalized.initializedFromBlank,
    needsInitialDiskSave: normalized.needsInitialDiskSave ?? false,
    revision: 0,
  };
}

function noop() {}

export function FileEditorProvider({ children }) {
  const { alert, confirm, prompt } = useAppDialog();
  const [documents, setDocuments] = useState([]);
  const [openDocumentIds, setOpenDocumentIds] = useState([]);
  const [activeDocumentId, setActiveDocumentIdState] = useState(null);
  const [themeKey, setThemeKey] = useState("basic");
  const [folderPath, setFolderPath] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
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

  useEffect(() => {
    if (model.errors.length > 0) return;
    setDocuments((current) => {
      const hasPolicy = current.some((doc) => doc.parseErrorPolicy);
      if (!hasPolicy) return current;
      return current.map((doc) =>
        doc.parseErrorPolicy ? { ...doc, parseErrorPolicy: null } : doc,
      );
    });
  }, [model.errors.length, src]);

  const hasUnsavedChanges = isDocumentDirty(activeDocument);
  const hasAnyUnsavedChanges = documents.some(isDocumentDirty);
  const documentsRef = useRef(documents);
  const activeDocumentIdRef = useRef(activeDocumentId);
  const lastSaveRef = useRef({ id: null, at: 0 });

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    activeDocumentIdRef.current = activeDocumentId;
  }, [activeDocumentId]);

  function setActiveDocumentParseErrorPolicy(policy) {
    if (isReadOnly || !activeDocumentId) return;
    setDocuments((current) =>
      current.map((doc) =>
        doc.id === activeDocumentId ? { ...doc, parseErrorPolicy: policy } : doc,
      ),
    );
  }

  function updateDocumentSrc(documentId, nextSrc) {
    if (isReadOnly) return;
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

  const saveDocuments = useCallback(async (overrideSrc) => {
    if (isReadOnly) return;
    const documentId = activeDocumentIdRef.current;
    if (!documentId) return;

    const doc = documentsRef.current.find((d) => d.id === documentId);
    const contentToWrite =
      typeof overrideSrc === "string" ? overrideSrc : doc?.src;
    if (!doc || contentToWrite == null) return;
    if (
      typeof overrideSrc !== "string" &&
      !isDocumentDirty(doc)
    ) {
      return;
    }
    lastSaveRef.current = { id: documentId, at: Date.now() };

    try {
      await window.api.writeTxtFile(documentId, contentToWrite);
      setDocuments((current) =>
        current.map((d) =>
          d.id === documentId
            ? {
                ...d,
                savedSrc: contentToWrite,
                needsInitialDiskSave: false,
                initializedFromBlank: false,
                parseErrorPolicy: null,
              }
            : d,
        ),
      );
    } catch (err) {
      await alert(err?.message || "ファイルを保存できませんでした。");
    }
  }, [isReadOnly, alert]);

  const loadFolder = useCallback(async (path, fileList, { readOnly = false } = {}) => {
    window.api.removeFileChangedListener();
    window.api.stopWatch();

    const docs = fileList.map((file) => createDocument(file.name, file.content));
    const ids = docs.map((doc) => doc.id).sort();

    setFolderPath(path);
    setIsReadOnly(readOnly);
    setDocuments(docs);
    setOpenDocumentIds(ids);
    setActiveDocumentIdState(ids[0] ?? null);
    setIsHydrated(true);

    if (ids.length > 0 && !readOnly) {
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
        const recentlySaved =
          lastSaveRef.current.id === name &&
          Date.now() - lastSaveRef.current.at < 3000;

        setDocuments((current) => {
          const existing = current.find((doc) => doc.id === name);
          if (!existing) {
            return [...current, createDocument(name, content)];
          }

          const isDirty = isDocumentDirty(existing);

          if (recentlySaved) {
            return current;
          }

          return current.map((doc) =>
            doc.id === name
              ? syncDocumentFromDisk(doc, content, {
                  isDirty,
                  skipStaleBlank: true,
                })
              : doc,
          );
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
    await loadFolder(path, files, { readOnly: true });
  }

  async function createNewTxtFile() {
    if (!folderPath || isReadOnly) return;

    const suggested = suggestNewTxtFileName(openDocumentIds);
    const entered = await prompt(
      "新規 .txt ファイル名（フォルダ内の相対パス可）",
      suggested,
    );
    if (entered === null) return;

    const relPath = normalizeNewTxtRelPath(entered);
    if (!relPath) {
      await alert("有効なファイル名を入力してください（例: 新規-1.txt）");
      return;
    }
    if (openDocumentIds.includes(relPath)) {
      await alert("同名のファイルが既にあります。");
      return;
    }

    const content = dslContentFromTemplate(relPath, DEFAULT_TAB_TEMPLATE);
    try {
      await window.api.createTxtFile(relPath, content);
    } catch (err) {
      await alert(err?.message || "ファイルを作成できませんでした。");
      return;
    }

    const doc = createDocument(relPath, content);
    setDocuments((current) => [...current, doc].sort((a, b) => a.id.localeCompare(b.id)));
    setOpenDocumentIds((current) => [...current, relPath].sort());
    setActiveDocumentIdState(relPath);
  }

  async function setActiveDocumentId(documentId) {
    if (documentId === activeDocumentId) return;

    const leaving = documents.find((d) => d.id === activeDocumentId);
    if (leaving && isDocumentDirty(leaving)) {
      const ok = await confirm(
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
    isReadOnly,
    src,
    model,
    activeParseErrorPolicy,
    setActiveDocumentParseErrorPolicy,
    hasUnsavedChanges,
    hasAnyUnsavedChanges,
    activeDocumentInitializedFromBlank: Boolean(activeDocument?.needsInitialDiskSave),
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
    isReadOnly,
    openFolder,
    openSamples,
    loadFolder,
    createNewTxtFile,
  };

  return (
    <FolderContext.Provider value={folderValue}>
      <EditorContext.Provider value={editorValue}>{children}</EditorContext.Provider>
    </FolderContext.Provider>
  );
}
