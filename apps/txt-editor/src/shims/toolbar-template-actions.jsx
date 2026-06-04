import { createContext, useContext } from "react";
import { ChevronDown } from "lucide-react";
import { useEditor } from "@web/hooks/use-editor";
import { getModelCounts } from "@web/components/editor/model-counts";

const TemplateModalContext = createContext(null);

export function TemplateModalProvider({ onOpenTemplate, children }) {
  return (
    <TemplateModalContext.Provider value={onOpenTemplate}>
      {children}
    </TemplateModalContext.Provider>
  );
}

const TEMPLATE_MENU = [
  { kind: "roles", label: "ロール" },
  { kind: "blocks", label: "ブロック" },
  { kind: "props", label: "プロップ" },
];

/** Replaces @web toolbar-template-actions for Electron (inline modal instead of popup). */
export function ToolbarTemplateActions() {
  const onOpenTemplate = useContext(TemplateModalContext);
  const { model } = useEditor();
  const counts = getModelCounts(model);

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-700 rounded-sm text-stone-300 hover:bg-stone-800 transition whitespace-nowrap">
        テンプレート <ChevronDown size={13} />
      </summary>
      <div
        role="menu"
        className="absolute right-0 mt-1 min-w-32 rounded-sm border border-stone-700 bg-stone-900 shadow-lg overflow-hidden z-50"
      >
        {TEMPLATE_MENU.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            role="menuitem"
            onClick={() => onOpenTemplate?.(kind)}
            className="w-full flex items-center justify-between gap-3 font-jp text-xs px-3 py-2 text-stone-200 hover:bg-stone-800 transition"
          >
            <span>{label}</span>
            <span className="shrink-0 text-center rounded-full bg-stone-100 text-stone-900 text-[10px] font-mono px-1.5 py-0.5 tabular-nums">
              {counts[kind]}
            </span>
          </button>
        ))}
      </div>
    </details>
  );
}
