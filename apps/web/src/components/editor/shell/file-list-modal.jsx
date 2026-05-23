import { useRef } from "react";
import { FileText, FileUp, Trash2, X } from "lucide-react";
import {
  documentNameFromFile,
  extractDocumentTitle,
} from "../../../lib/document-title";

export function FileListModal({
  documents,
  activeDocumentId,
  onSelectDocument,
  onDeleteDocument,
  onImportDocument,
  onClose,
}) {
  const fileInputRef = useRef(null);

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    let text;
    try {
      text = await file.text();
    } catch (error) {
      console.error("DSL import failed", error);
      alert("ファイルの読み込みに失敗しました。");
      return;
    }

    const preferredName = documentNameFromFile(file);
    onImportDocument(text, preferredName);
  }

  return (
    <div
      className="fixed inset-0 bg-stone-900/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-stone-50 max-w-2xl w-full rounded-sm shadow-2xl border border-stone-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-300 gap-3">
          <h2 className="font-display text-xl font-bold">ローカルファイル一覧</h2>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleImportClick}
              className="inline-flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm text-stone-700 hover:bg-stone-200 transition"
            >
              <FileUp size={14} />
              .txt 読込
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-500 hover:text-stone-900 p-1"
              aria-label="Close file list"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <p className="px-5 pt-3 text-[11px] text-stone-500 font-jp">
          .txt 読込は新しいタブで開きます。
        </p>

        <div className="p-5 pt-2 space-y-2 font-jp text-sm text-stone-700 max-h-[70vh] overflow-auto">
          {documents.map((document) => {
            const isActive = document.id === activeDocumentId;
            const isDirty = document.src !== document.savedSrc;
            const title = extractDocumentTitle(document.src, document.name);

            return (
              <div
                key={document.id}
                className={`flex items-center justify-between gap-3 border rounded-sm px-3 py-2 ${
                  isActive ? "border-stone-900 bg-stone-100" : "border-stone-300 bg-white"
                }`}
              >
                <button
                  type="button"
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
                  type="button"
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

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
