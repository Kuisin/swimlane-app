import { ExportMenu } from "../export-menu.jsx";

export function TitleField({ title, onChange, src, modelTitle, themeBg }) {
  return (
    <div className="px-3 py-2 border-b border-stone-700/60">
      <label className="block text-[10px] font-jp text-stone-500 mb-1">タイトル</label>
      <div className="flex flex-row items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-sm font-jp text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <ExportMenu src={src} modelTitle={modelTitle} themeBg={themeBg} />
      </div>
    </div>
  );
}
