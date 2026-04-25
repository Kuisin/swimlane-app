export function EditorPanel({ src, onChange, model }) {
  const stepCount = model.rows.filter((r) => r.kind === "step").length;
  const blockCount = Object.keys(model.blocks || {}).length;

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="px-4 py-3 border-b border-stone-700/60 flex items-center justify-between shrink-0">
        <span className="font-mono text-xs text-stone-400 tracking-wider uppercase">
          editor
        </span>
        <div className="flex items-center gap-3 font-mono text-[10px] text-stone-500">
          <span>{model.lanes.length} roles</span>
          <span className="text-stone-700">·</span>
          <span>{blockCount} blocks</span>
          <span className="text-stone-700">·</span>
          <span>{stepCount} steps</span>
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
