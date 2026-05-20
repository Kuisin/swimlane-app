export function TitleField({ title, onChange }) {
  return (
    <div className="px-3 sm:px-4 py-2 border-b border-stone-700/60 shrink-0">
      <label className="block text-[10px] font-jp text-stone-500 mb-1">タイトル</label>
      <input
        type="text"
        value={title}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm font-jp text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-500"
      />
    </div>
  );
}
