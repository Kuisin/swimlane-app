import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function PreviewPickModal({ title, open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/60"
        aria-label="閉じる"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-pick-modal-title"
        className="relative z-10 w-full max-w-lg max-h-[min(85vh,640px)] flex flex-col rounded-lg border border-stone-600 bg-stone-900 shadow-2xl"
      >
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-700 shrink-0">
          <h2
            id="preview-pick-modal-title"
            className="font-jp text-sm font-semibold text-stone-100"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-700 text-stone-400"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
