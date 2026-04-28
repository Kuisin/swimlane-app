import { useState } from "react";
import { Check, ChevronDown, Copy, Download, Save } from "lucide-react";
import { downloadPNG, downloadSVG } from "../lib/export";

export function EditorPanel({
  src,
  onChange,
  model,
  modelTitle,
  themeBg,
  hasUnsavedChanges,
  onSave,
}) {
  const [copied, setCopied] = useState(false);
  const stepCount = model.rows.filter((r) => r.kind === "step").length;
  const blockCount = Object.keys(model.blocks || {}).length;

  async function copyDSL() {
    await navigator.clipboard.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="px-4 py-2 border-b border-stone-700/60 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-mono text-xs text-stone-400 tracking-wider uppercase">
            editor
          </span>
          <div className="flex items-center gap-1 font-mono text-[10px] text-stone-500">
            <span>{model.lanes.length} roles</span>
            <span className="text-stone-700">·</span>
            <span>{blockCount} blocks</span>
            <span className="text-stone-700">·</span>
            <span>{stepCount} steps</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyDSL}
            className="flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-700 rounded-sm text-stone-300 hover:bg-stone-800 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "済" : "コピー"}
          </button>
          <details className="relative">
            <summary className="list-none cursor-pointer flex items-center gap-1.5 text-xs font-jp px-3 py-2 border border-stone-700 rounded-sm text-stone-300 hover:bg-stone-800 transition">
              <Download size={14} /> 出力 <ChevronDown size={13} />
            </summary>
            <div className="absolute right-0 mt-1 w-28 rounded-sm border border-stone-700 bg-stone-900 shadow-lg overflow-hidden z-10">
              <button
                onClick={() => downloadSVG(modelTitle)}
                className="w-full text-left px-3 py-2 text-xs font-jp text-stone-200 hover:bg-stone-800"
              >
                SVG
              </button>
              <button
                onClick={() => downloadPNG(modelTitle, themeBg)}
                className="w-full text-left px-3 py-2 text-xs font-jp text-stone-200 hover:bg-stone-800"
              >
                PNG
              </button>
            </div>
          </details>
          {/* move copy text button here */}
          <button
            onClick={onSave}
            className={`flex items-center gap-1.5 text-xs font-jp px-3 py-2 border rounded-sm transition ${
              hasUnsavedChanges
                ? "border-amber-500 text-amber-300 bg-amber-950/40 hover:bg-amber-900/40"
                : "border-stone-700 text-stone-300 hover:bg-stone-800"
            }`}
          >
            <Save size={14} /> {hasUnsavedChanges ? "保存*" : "保存"}
          </button>
        </div>
      </div>

      <textarea
        value={src}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 w-full p-4 bg-transparent text-stone-100 font-mono text-sm leading-relaxed outline-none resize-none"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      />

      {model.errors.length > 0 && (
        <div className="border-t border-red-900/50 bg-red-950/30 p-3 max-h-48 overflow-auto shrink-0">
          <div className="font-mono text-[10px] text-red-400 uppercase tracking-wider mb-1.5">
            解析エラー
          </div>
          {model.errors.map((e, i) => (
            <div key={i} className="font-mono text-xs text-red-300">
              L{e.line}: {e.msg} → {e.text.trim()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
