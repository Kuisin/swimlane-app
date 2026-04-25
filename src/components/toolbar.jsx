import { useState } from "react";
import { Download, Copy, Check, BookOpen } from "lucide-react";
import { THEMES } from "../lib/themes";
import { downloadSVG, downloadPNG } from "../lib/export";

export function Toolbar({
  themeKey,
  onThemeChange,
  theme,
  modelTitle,
  src,
  onShowHelp,
}) {
  const [copied, setCopied] = useState(false);

  const copyDSL = async () => {
    await navigator.clipboard.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="border-b border-stone-300 bg-stone-50">
      <div className="max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            スイムレーン
          </h1>
          <span className="font-jp text-xs text-stone-500 tracking-widest uppercase">
            @kai-swimlane · Diagram Editor
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border border-stone-300 rounded-sm overflow-hidden">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => onThemeChange(key)}
                className={`font-jp text-xs px-3 py-2 transition ${
                  themeKey === key
                    ? "bg-stone-900 text-stone-50"
                    : "bg-stone-50 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <button
            onClick={onShowHelp}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            <BookOpen size={14} /> 構文
          </button>

          <button
            onClick={copyDSL}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
            {copied ? "済" : "コピー"}
          </button>

          <button
            onClick={() => downloadSVG(modelTitle)}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-300 rounded-sm hover:bg-stone-200 transition"
          >
            <Download size={14} /> SVG
          </button>

          <button
            onClick={() => downloadPNG(modelTitle, theme.bg)}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 bg-stone-900 text-stone-50 rounded-sm hover:bg-stone-700 transition"
          >
            <Download size={14} /> PNG
          </button>
        </div>
      </div>
    </header>
  );
}
