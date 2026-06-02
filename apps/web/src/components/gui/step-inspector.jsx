import {
  BlockFieldWithPicker,
  PropsFieldWithPicker,
} from "./step-parts-pickers";

export function StepInspector({
  row,
  lanes,
  blocks,
  props,
  themeKey,
  onPatch,
}) {
  if (!row || row.kind !== "step" || row.empty) {
    return (
      <p className="text-xs font-jp text-stone-500 px-3 py-4">
        手順を選択してください
      </p>
    );
  }

  return (
    <div className="px-3 py-3 space-y-3 text-xs font-jp">
      <div>
        <label className="block text-[10px] text-stone-500 mb-1">役割</label>
        <select
          value={row.role || ""}
          onChange={(e) => onPatch({ role: e.target.value })}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
        >
          {lanes.map((lane) => (
            <option key={lane.id} value={lane.id}>
              {lane.label || lane.id}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] text-stone-500 mb-1">本文</label>
        <input
          type="text"
          value={row.text || ""}
          onChange={(e) => onPatch({ text: e.target.value })}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
        />
      </div>
      <div>
        <label className="block text-[10px] text-stone-500 mb-1">ブロック</label>
        <BlockFieldWithPicker
          value={row.blockRef}
          blocks={blocks}
          themeKey={themeKey}
          onChange={(blockRef) => onPatch({ blockRef })}
        />
      </div>
      <div>
        <label className="block text-[10px] text-stone-500 mb-1">
          id（merge 合流先・ファイル内で一意）
        </label>
        <input
          type="text"
          value={row.mergeId || ""}
          onChange={(e) => onPatch({ mergeId: e.target.value || undefined })}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
        />
      </div>
      <div>
        <label className="block text-[10px] text-stone-500 mb-1">ラベル</label>
        <input
          type="text"
          value={row.name || ""}
          onChange={(e) => onPatch({ name: e.target.value || undefined })}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
        />
      </div>
      <div>
        <label className="block text-[10px] text-stone-500 mb-1">説明</label>
        <textarea
          value={row.description || ""}
          onChange={(e) =>
            onPatch({ description: e.target.value || undefined })
          }
          rows={2}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100 resize-y"
        />
      </div>
      <div>
        <label className="block text-[10px] text-stone-500 mb-1">プロップ</label>
        <PropsFieldWithPicker
          value={row.props}
          props={props}
          themeKey={themeKey}
          onChange={(ids) => onPatch({ props: ids })}
        />
      </div>
      <label className="flex items-center gap-2 text-stone-300">
        <input
          type="checkbox"
          checked={!!row.skipIndex}
          onChange={(e) =>
            onPatch({ skipIndex: e.target.checked || undefined })
          }
          className="rounded border-stone-500"
        />
        skip（番号なし）
      </label>
    </div>
  );
}
