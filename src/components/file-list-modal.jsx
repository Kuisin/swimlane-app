import { FileText, Trash2, X } from "lucide-react";

function getDocumentTitle(document) {
  const match = document.src.match(/\/title\/([\s\S]*?)(?:\n\/[a-z]+\/|$)/i);
  if (!match) return document.name;

  const firstLine = match[1]
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine || document.name;
}

export function FileListModal({
  documents,
  activeDocumentId,
  onSelectDocument,
  onDeleteDocument,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-stone-50 max-w-2xl w-full rounded-sm shadow-2xl border border-stone-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300">
          <h2 className="font-display text-xl font-bold">ローカルファイル一覧</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-900"
            aria-label="Close file list"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-2 font-jp text-sm text-stone-700 max-h-[70vh] overflow-auto">
          {documents.map((document) => {
            const isActive = document.id === activeDocumentId;
            const isDirty = document.src !== document.savedSrc;
            const title = getDocumentTitle(document);

            return (
              <div
                key={document.id}
                className={`flex items-center justify-between gap-3 border rounded-sm px-3 py-2 ${
                  isActive ? "border-stone-900 bg-stone-100" : "border-stone-300 bg-white"
                }`}
              >
                <button
                  onClick={() => onSelectDocument(document.id)}
                  className="flex items-center gap-2 min-w-0 text-left hover:text-stone-900"
                >
                  <FileText size={14} className="shrink-0" />
                  <span className="truncate">
                    {title}
                    {isDirty ? " *" : ""}
                  </span>
                </button>
                <button
                  onClick={() => onDeleteDocument(document.id)}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs border border-red-300 text-red-700 rounded-sm hover:bg-red-100"
                >
                  <Trash2 size={12} />
                  削除
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
