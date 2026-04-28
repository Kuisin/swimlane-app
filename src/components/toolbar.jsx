import { BookOpen, ChevronDown, Files } from "lucide-react";
import { THEMES } from "../lib/themes";

export function Toolbar({
  themeKey,
  onThemeChange,
  onShowFileList,
  onShowHelp,
}) {
  return (
    <header className="border-b border-stone-300 bg-stone-50">
      <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-xl font-bold tracking-tight">
            Swimlane Diagram Editor
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">

          <button
            onClick={onShowHelp}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            <BookOpen size={14} /> 構文
          </button>

          <details className="relative">
            <summary className="list-none cursor-pointer flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm text-stone-700 hover:bg-stone-200 transition">
              テーマ: {THEMES[themeKey]?.name || "Theme"} <ChevronDown size={13} />
            </summary>
            <div className="absolute right-0 mt-1 min-w-36 rounded-sm border border-stone-300 bg-stone-50 shadow-lg overflow-hidden z-10">
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => onThemeChange(key)}
                  className={`w-full text-left font-jp text-xs px-3 py-2 transition ${themeKey === key
                      ? "bg-stone-900 text-stone-50"
                      : "bg-stone-50 text-stone-700 hover:bg-stone-200"
                    }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </details>

          <button
            onClick={onShowFileList}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            <Files size={14} /> ファイル
          </button>

        </div>
      </div>
    </header>
  );
}
