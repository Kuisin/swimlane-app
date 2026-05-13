import { BookOpen, ChevronDown, Files, Settings } from "lucide-react";
import { THEMES } from "../lib/themes";

export function Toolbar({
  themeKey,
  onThemeChange,
  onShowFileList,
  onShowHelp,
  showStepBlockCaptions,
  onShowStepBlockCaptionsChange,
}) {
  return (
    <header className="border-b border-stone-300 bg-stone-50">
      <div className="mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
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

          <details className="relative">
            <summary className="list-none cursor-pointer flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm text-stone-700 hover:bg-stone-200 transition">
              <Settings size={14} /> 設定 <ChevronDown size={13} />
            </summary>
            <div className="absolute right-0 mt-1 min-w-56 rounded-sm border border-stone-300 bg-stone-50 shadow-lg overflow-hidden z-10 p-2">
              <label className="flex items-start gap-2 px-2 py-1.5 text-xs font-jp text-stone-700 cursor-pointer rounded-sm hover:bg-stone-200/80">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-stone-400"
                  checked={showStepBlockCaptions}
                  onChange={(event) =>
                    onShowStepBlockCaptionsChange(event.target.checked)
                  }
                />
                <span>
                  ステップの本文とブロック参照を表示
                  <span className="block text-[10px] text-stone-500 font-mono mt-0.5">
                    Step title and block ref
                  </span>
                </span>
              </label>
            </div>
          </details>

        </div>
      </div>
    </header>
  );
}
