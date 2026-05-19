import { useEffect } from "react";
import { X } from "lucide-react";

export function GuiSideModal({ title, open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="flex-1 bg-stone-900/50"
        aria-label="閉じる"
        onClick={onClose}
      />
      <aside className="w-full max-w-2xl h-full bg-stone-50 border-l border-stone-300 shadow-2xl flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <h2 className="font-jp text-sm font-bold text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-stone-200 text-stone-600"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </aside>
    </div>
  );
}
