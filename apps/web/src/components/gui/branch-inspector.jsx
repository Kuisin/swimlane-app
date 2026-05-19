import { BRANCH_COLOR_STYLES } from "@kai-swimlane/core";

const BRANCH_COLOR_KEYS = Object.keys(BRANCH_COLOR_STYLES);

export function BranchInspector({ row, rows, onPatch }) {
  if (!row) {
    return (
      <p className="text-xs font-jp text-stone-500 px-3 py-4">
        分岐行を選択してください
      </p>
    );
  }

  if (row.kind === "branchStart") {
    return (
      <div className="px-3 py-3 space-y-3 text-xs font-jp">
        <div>
          <label className="block text-[10px] text-stone-500 mb-1">条件</label>
          <input
            type="text"
            value={row.cond || ""}
            onChange={(e) => onPatch({ cond: e.target.value })}
            className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
          />
        </div>
        <p className="text-[10px] text-stone-500">
          分岐ケースは一覧の「分岐」行で編集します。
        </p>
      </div>
    );
  }

  if (row.kind === "branchCase") {
    const isElse = /^else$/i.test((row.label || "").trim());
    return (
      <div className="px-3 py-3 space-y-3 text-xs font-jp">
        <label className="flex items-center gap-2 text-stone-300">
          <input
            type="checkbox"
            checked={isElse}
            onChange={(e) => {
              if (e.target.checked) onPatch({ label: "else", branchColor: null });
              else onPatch({ label: "" });
            }}
            className="rounded border-stone-500"
          />
          else
        </label>
        {!isElse && (
          <>
            <div>
              <label className="block text-[10px] text-stone-500 mb-1">
                ケースラベル
              </label>
              <input
                type="text"
                value={row.label || ""}
                onChange={(e) => onPatch({ label: e.target.value })}
                className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
              />
            </div>
            <BranchColorSelect
              value={row.branchColor || ""}
              onChange={(branchColor) =>
                onPatch({ branchColor: branchColor || null })
              }
            />
          </>
        )}
      </div>
    );
  }

  if (row.kind === "branchLoop") {
    const parent = rows.find(
      (r) => r.kind === "branchStart" && r.id === row.loopBranchId
    );
    return (
      <div className="px-3 py-3 text-xs font-jp text-stone-400">
        <p className="text-[10px] text-stone-500 mb-1">ループ（親の if）</p>
        <p className="text-stone-200">{parent?.cond || "—"}</p>
      </div>
    );
  }

  return (
    <p className="text-xs font-jp text-stone-500 px-3 py-4">
      分岐行を選択してください
    </p>
  );
}

function BranchColorSelect({ value, onChange }) {
  return (
    <div>
      <label className="block text-[10px] text-stone-500 mb-1">分岐色</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
      >
        <option value="">（テーマ既定）</option>
        {BRANCH_COLOR_KEYS.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </div>
  );
}
