import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { X } from "lucide-react";
import { RolesTemplatePanel } from "../components/gui/roles-modal";
import { BlocksTemplatePanel } from "../components/gui/blocks-modal";
import { PropsTemplatePanel } from "../components/gui/props-modal";
import { useEditor } from "../hooks/use-editor";

const KIND_CONFIG = {
  roles: { title: "役割", Panel: RolesTemplatePanel },
  blocks: { title: "ブロック", Panel: BlocksTemplatePanel },
  props: { title: "プロップ", Panel: PropsTemplatePanel },
};

export function TemplatePopupPage() {
  const { kind } = useParams();
  const { isHydrated } = useEditor();
  const guardRef = useRef(() => true);
  const config = KIND_CONFIG[kind];

  const registerGuardUnsaved = useCallback((guard) => {
    guardRef.current = guard;
  }, []);

  function handleClose() {
    if (!guardRef.current()) return;
    window.close();
  }

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!config) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-4 bg-stone-50 font-jp text-stone-700">
        <p>不明なテンプレート種別です。</p>
        <button
          type="button"
          onClick={() => window.close()}
          className="text-xs px-3 py-1.5 border border-stone-300 rounded hover:bg-stone-100"
        >
          閉じる
        </button>
      </div>
    );
  }

  const { title, Panel } = config;

  return (
    <div className="h-dvh w-dvw bg-stone-50 text-stone-900 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-jp { font-family: 'Noto Sans JP', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>
      <header className="flex items-center justify-between px-4 py-3 border-b border-stone-200 shrink-0">
        <h1 className="font-jp text-sm font-bold text-stone-900">{title}</h1>
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
        {isHydrated ? (
          <Panel registerGuardUnsaved={registerGuardUnsaved} />
        ) : (
          <p className="p-4 text-xs text-stone-500 font-jp">読み込み中…</p>
        )}
      </div>
    </div>
  );
}
