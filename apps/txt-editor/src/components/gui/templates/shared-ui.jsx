export function DefaultTemplateDetail({
  item,
  preview,
  onInsert,
  insertLabel = "挿入",
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold font-jp">{item.title}</h3>
      {preview}
      <pre className="text-[10px] font-mono bg-stone-900 text-stone-100 p-3 rounded overflow-auto max-h-40">
        {item.code}
      </pre>
      <button
        type="button"
        onClick={onInsert}
        className="text-xs font-jp px-3 py-1.5 border border-stone-300 rounded hover:bg-stone-100"
      >
        {insertLabel}
      </button>
    </div>
  );
}

export function ColorSwatch({ color }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-sm border border-stone-300 shrink-0"
      style={{ background: color || "#e7e5e4" }}
    />
  );
}
