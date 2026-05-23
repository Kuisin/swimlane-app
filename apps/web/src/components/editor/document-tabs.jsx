import { extractTitleFromSource } from "../lib/document-utils";

export function DocumentTabs({
  openDocuments,
  activeDocumentId,
  onSelectDocument,
  onCloseDocument,
  onAddDocument,
  className = "",
}) {
  return (
    <div
      className={`px-4 pt-3 border-b flex items-center gap-2 overflow-x-auto ${className}`}
    >
      {openDocuments.map((document) => {
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
              type="button"
              onClick={() => onSelectDocument(document.id)}
              className={`px-3 py-1.5 text-left ${isActive ? "" : "hover:text-stone-200"}`}
            >
              {documentTitle}
              {isDirty ? " *" : ""}
            </button>
            <button
              type="button"
              onClick={() => onCloseDocument(document.id)}
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
        type="button"
        onClick={onAddDocument}
        className="shrink-0 text-xs font-mono px-2 py-1 rounded bg-stone-700 text-stone-300 hover:text-stone-100 hover:bg-stone-500"
      >
        + Tab
      </button>
    </div>
  );
}
