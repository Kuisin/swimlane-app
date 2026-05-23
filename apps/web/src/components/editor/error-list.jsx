export function EditorErrorList({ errors, includeText = false }) {
  if (!errors?.length) return null;

  return (
    <div className="border-t border-red-900/50 bg-red-950/30 p-3 max-h-48 overflow-auto shrink-0">
      <div className="font-mono text-[10px] text-red-400 uppercase tracking-wider mb-1.5">
        解析エラー
      </div>
      {errors.map((err, i) => (
        <div key={i} className="font-mono text-xs text-red-300">
          L{err.line}: {err.msg}
          {includeText && err.text ? ` → ${err.text.trim()}` : ""}
        </div>
      ))}
    </div>
  );
}
