import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export const AppDialogContext = createContext(null);

function DialogOverlay({ children, onBackdropClick }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onBackdropClick}
      role="presentation"
    >
      <div
        className="bg-stone-50 text-stone-900 rounded-sm shadow-xl w-full max-w-md border border-stone-300"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

function AppDialogHost({ dialog, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (dialog?.type !== "prompt") return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [dialog]);

  if (!dialog) return null;

  if (dialog.type === "alert") {
    return (
      <DialogOverlay onBackdropClick={() => onClose(dialog.resolve)}>
        <div className="px-4 py-4">
          <p className="font-jp text-sm text-stone-800 whitespace-pre-wrap">
            {dialog.message}
          </p>
        </div>
        <footer className="flex justify-end gap-2 px-4 py-3 border-t border-stone-200">
          <button
            type="button"
            onClick={() => onClose(dialog.resolve)}
            className="text-xs font-jp px-4 py-2 bg-stone-900 text-stone-50 rounded-sm hover:bg-stone-800"
          >
            OK
          </button>
        </footer>
      </DialogOverlay>
    );
  }

  if (dialog.type === "confirm") {
    return (
      <DialogOverlay onBackdropClick={() => onClose(() => dialog.resolve(false))}>
        <div className="px-4 py-4">
          <p className="font-jp text-sm text-stone-800 whitespace-pre-wrap">
            {dialog.message}
          </p>
        </div>
        <footer className="flex justify-end gap-2 px-4 py-3 border-t border-stone-200">
          <button
            type="button"
            onClick={() => onClose(() => dialog.resolve(false))}
            className="text-xs font-jp px-4 py-2 border border-stone-300 rounded-sm hover:bg-stone-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => onClose(() => dialog.resolve(true))}
            className="text-xs font-jp px-4 py-2 bg-stone-900 text-stone-50 rounded-sm hover:bg-stone-800"
          >
            OK
          </button>
        </footer>
      </DialogOverlay>
    );
  }

  if (dialog.type === "prompt") {
    return (
      <DialogOverlay onBackdropClick={() => onClose(() => dialog.resolve(null))}>
        <div className="px-4 py-4 space-y-3">
          <p className="font-jp text-sm text-stone-800">{dialog.message}</p>
          <input
            ref={inputRef}
            type="text"
            defaultValue={dialog.defaultValue ?? ""}
            className="w-full rounded-sm border border-stone-300 px-3 py-2 text-sm font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onClose(() => dialog.resolve(e.currentTarget.value));
              }
              if (e.key === "Escape") {
                onClose(() => dialog.resolve(null));
              }
            }}
          />
        </div>
        <footer className="flex justify-end gap-2 px-4 py-3 border-t border-stone-200">
          <button
            type="button"
            onClick={() => onClose(() => dialog.resolve(null))}
            className="text-xs font-jp px-4 py-2 border border-stone-300 rounded-sm hover:bg-stone-100"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => {
              const value = inputRef.current?.value ?? "";
              onClose(() => dialog.resolve(value));
            }}
            className="text-xs font-jp px-4 py-2 bg-stone-900 text-stone-50 rounded-sm hover:bg-stone-800"
          >
            OK
          </button>
        </footer>
      </DialogOverlay>
    );
  }

  return null;
}

export function AppDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  function finish(getResult) {
    const result = getResult();
    dialog?.resolve?.(result);
    setDialog(null);
  }

  const alert = useCallback(
    (message) =>
      new Promise((resolve) => {
        setDialog({ type: "alert", message, resolve: () => resolve() });
      }),
    [],
  );

  const confirm = useCallback(
    (message) =>
      new Promise((resolve) => {
        setDialog({ type: "confirm", message, resolve });
      }),
    [],
  );

  const prompt = useCallback(
    (message, defaultValue = "") =>
      new Promise((resolve) => {
        setDialog({ type: "prompt", message, defaultValue, resolve });
      }),
    [],
  );

  return (
    <AppDialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      <AppDialogHost dialog={dialog} onClose={finish} />
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return ctx;
}
