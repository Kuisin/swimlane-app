import { useCallback, useRef } from "react";
import { X } from "lucide-react";
import {
  BlocksTemplatePanel,
  PropsTemplatePanel,
  RolesTemplatePanel,
} from "./gui/templates/panels";

const KIND_CONFIG = {
  roles: { title: "役割", Panel: RolesTemplatePanel },
  blocks: { title: "ブロック", Panel: BlocksTemplatePanel },
  props: { title: "プロップ", Panel: PropsTemplatePanel },
};

export function TemplateModal({ kind, onClose }) {
  const guardRef = useRef(() => true);
  const config = KIND_CONFIG[kind];

  const registerGuardUnsaved = useCallback((guard) => {
    guardRef.current = guard;
  }, []);

  function handleClose() {
    if (!guardRef.current()) return;
    onClose();
  }

  if (!config) return null;

  const { title, Panel } = config;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="bg-stone-50 text-stone-900 rounded-sm shadow-xl w-full max-w-3xl h-[min(80vh,720px)] flex flex-col border border-stone-300"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-modal-title"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200 shrink-0">
          <h2 id="template-modal-title" className="font-jp text-sm font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded hover:bg-stone-200 text-stone-600"
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden">
          <Panel registerGuardUnsaved={registerGuardUnsaved} />
        </div>
      </div>
    </div>
  );
}
