import { NavLink } from "react-router-dom";
import { BookOpen, ChevronDown, Files, Settings } from "lucide-react";
import { THEMES } from "@kai-swimlane/core";

const navLinkClass = ({ isActive }) =>
  `text-xs font-jp px-3 py-2 border rounded-sm transition ${
    isActive
      ? "bg-stone-900 text-stone-50 border-stone-900"
      : "border-stone-300 text-stone-700 hover:bg-stone-200"
  }`;

export function Toolbar({
  themeKey,
  onThemeChange,
  onShowFileList,
  onShowHelp,
  onShowOptions,
  guiActions = null,
}) {
  return (
    <header className="relative z-40 border-b border-stone-300 bg-stone-50">
      <div className="mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-baseline gap-4 flex-wrap">
          <h1 className="font-display text-xl font-bold tracking-tight">
            Swimlane Diagram Editor
          </h1>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              テキスト
            </NavLink>
            <NavLink to="/gui" className={navLinkClass}>
              GUI
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {guiActions}

          <button
            type="button"
            onClick={onShowHelp}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            <BookOpen size={14} /> 構文
          </button>

          <details className="relative">
            <summary className="list-none cursor-pointer flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm text-stone-700 hover:bg-stone-200 transition">
              テーマ: {THEMES[themeKey]?.name || "Theme"} <ChevronDown size={13} />
            </summary>
            <div className="absolute right-0 mt-1 min-w-36 rounded-sm border border-stone-300 bg-stone-50 shadow-lg overflow-hidden z-50">
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onThemeChange(key)}
                  className={`w-full text-left font-jp text-xs px-3 py-2 transition ${
                    themeKey === key
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
            type="button"
            onClick={onShowFileList}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            <Files size={14} /> ファイル
          </button>

          <button
            type="button"
            onClick={onShowOptions}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm text-stone-700 hover:bg-stone-200 transition"
          >
            <Settings size={14} /> オプション
          </button>
        </div>
      </div>
    </header>
  );
}
