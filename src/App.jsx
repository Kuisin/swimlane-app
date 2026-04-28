import { useEffect, useMemo, useState } from "react";
import SAMPLE from "./sample.txt?raw";
import HELP_MD from "./help.md?raw";
import { parseDSL } from "./lib/parser";
import { THEMES } from "./lib/themes";
import { Diagram } from "./components/diagram/diagram";
import { EditorPanel } from "./components/editor-panel";
import { Toolbar } from "./components/toolbar";
import { HelpModal } from "./components/help-modal";

const STORAGE_KEY = "swimlane-editor-state-v1";
const DEFAULT_TAB_TEMPLATE = `@kai-swimlane
/title/
New Document

/role/

/block/

/prop/

/line/

@end
`;

function createDocument(id, name, src) {
  return { id, name, src, savedSrc: src };
}

function createNextDocumentName(documents) {
  return `Document ${documents.length + 1}`;
}

function createDocumentId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractTitleFromSource(src) {
  const match = src.match(/\/title\/([\s\S]*?)(?:\n\/[a-z]+\/|$)/i);
  if (!match) return "";

  const firstLine = match[1]
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine || "";
}

export default function App() {
  const [documents, setDocuments] = useState([createDocument("doc-1", "Document 1", SAMPLE)]);
  const [activeDocumentId, setActiveDocumentId] = useState("doc-1");
  const [themeKey, setThemeKey] = useState("basic");
  const [showHelp, setShowHelp] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.documents) && parsed.documents.length > 0) {
        const restoredDocuments = parsed.documents.map((doc, index) =>
          ({
            id: doc.id || `doc-${index + 1}`,
            name: doc.name || `Document ${index + 1}`,
            src: typeof doc.src === "string" ? doc.src : "",
            savedSrc:
              typeof doc.savedSrc === "string"
                ? doc.savedSrc
                : typeof doc.src === "string"
                ? doc.src
                : "",
          })
        );
        setDocuments(restoredDocuments);
        setActiveDocumentId(parsed.activeDocumentId || restoredDocuments[0].id);
      }
      if (typeof parsed.themeKey === "string" && THEMES[parsed.themeKey]) {
        setThemeKey(parsed.themeKey);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const activeDocument =
    documents.find((document) => document.id === activeDocumentId) || documents[0];
  const src = activeDocument?.src || "";

  const theme = THEMES[themeKey];
  const model = useMemo(() => parseDSL(src), [src]);
  const hasUnsavedChanges = documents.some((document) => document.src !== document.savedSrc);

  useEffect(() => {
    if (!isHydrated) return;

    const payload = {
      documents: documents.map(({ id, name, src, savedSrc }) => ({
        id,
        name,
        src,
        savedSrc,
      })),
      activeDocumentId,
      themeKey,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [documents, activeDocumentId, themeKey, isHydrated]);

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
        document.id === activeDocumentId ? { ...document, src: nextSrc } : document
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
    setActiveDocumentId(id);
  }

  function closeDocumentTab(documentId) {
    setDocuments((currentDocuments) => {
      if (currentDocuments.length === 1) {
        const blankDocument = createDocument(
          createDocumentId(),
          "Document 1",
          DEFAULT_TAB_TEMPLATE
        );
        setActiveDocumentId(blankDocument.id);
        return [blankDocument];
      }

      const closingIndex = currentDocuments.findIndex(
        (document) => document.id === documentId
      );
      const nextDocuments = currentDocuments.filter(
        (document) => document.id !== documentId
      );

      if (documentId === activeDocumentId) {
        const nextIndex = Math.max(0, closingIndex - 1);
        setActiveDocumentId(nextDocuments[nextIndex].id);
      }

      return nextDocuments;
    });
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Shippori Mincho', serif; }
        .font-jp { font-family: 'Noto Sans JP', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>

      <Toolbar
        themeKey={themeKey}
        onThemeChange={setThemeKey}
        theme={theme}
        modelTitle={model.title}
        src={src}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveDocuments}
        onShowHelp={() => setShowHelp(true)}
      />

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-stone-100 p-6 overflow-auto">
          <div
            className="rounded-sm shadow-lg border border-stone-300 overflow-hidden"
            style={{ background: theme.bg }}
          >
            <Diagram model={model} theme={theme} />
          </div>
          <div className="mt-3 font-jp text-[11px] text-stone-500 flex justify-between">
            <span>プレビュー · Preview</span>
            <span>{model.title}</span>
          </div>
        </div>

        <div className="border-r border-stone-300 bg-stone-900 text-stone-100 flex flex-col min-h-[calc(100vh-73px)]">
          <div className="px-4 pt-3 border-b border-stone-700/60 flex items-center gap-2 overflow-x-auto">
            {documents.map((document) => {
              const isActive = document.id === activeDocumentId;
              const isDirty = document.src !== document.savedSrc;
              const documentTitle =
                extractTitleFromSource(document.src) || document.name;
              return (
                <div
                  key={document.id}
                  className={`shrink-0 text-xs font-mono rounded-t-sm border flex items-center ${
                    isActive
                      ? "bg-stone-800 text-stone-50 border-stone-600"
                      : "bg-stone-900 text-stone-400 border-stone-700"
                  }`}
                >
                  <button
                    onClick={() => setActiveDocumentId(document.id)}
                    className={`px-3 py-1.5 text-left ${
                      isActive ? "" : "hover:text-stone-200"
                    }`}
                  >
                    {documentTitle}
                    {isDirty ? " *" : ""}
                  </button>
                  <button
                    onClick={() => closeDocumentTab(document.id)}
                    className={`pr-2 pl-1 py-1.5 ${
                      isActive
                        ? "text-stone-300 hover:text-stone-50"
                        : "text-stone-500 hover:text-stone-200"
                    }`}
                    aria-label={`Close ${documentTitle}`}
                  >
                    x
                  </button>
                </div>
              );
            })}
            <button
              onClick={addDocumentTab}
              className="shrink-0 text-xs font-mono px-2.5 py-1.5 rounded-sm border border-stone-700 text-stone-300 hover:text-stone-100 hover:border-stone-500"
            >
              + Tab
            </button>
          </div>
          <EditorPanel src={src} onChange={updateActiveDocumentSrc} model={model} />
        </div>
      </div>

      {showHelp && (
        <HelpModal helpMd={HELP_MD} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
