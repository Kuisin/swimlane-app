import { BRANCH_COLOR_STYLES } from "@kai-swimlane/core";
import {
  collectMergeTargetOptions,
  nextStepMergeId,
} from "../../lib/flow-rows";

const BRANCH_COLOR_KEYS = Object.keys(BRANCH_COLOR_STYLES);

export function BranchInspector({
  row,
  rows,
  onPatch,
  viaBranchEnd = false,
  onMergeTargetPick,
}) {
  if (!row) {
    return (
      <p className="text-xs font-jp text-stone-500 px-3 py-4">
        分岐行を選択してください
      </p>
    );
  }

  if (row.kind === "branchStart") {
    if (row.parallel) {
      return (
        <div className="px-3 py-3 space-y-3 text-xs font-jp">
          {viaBranchEnd && <BranchEndHint parallel />}
          <p className="text-stone-300">並行処理（同時に実行）</p>
          <BranchColorSelect
            value={row.branchColor || ""}
            onChange={(branchColor) =>
              onPatch({ branchColor: branchColor || null })
            }
          />
          <p className="text-[10px] text-stone-500">
            並行パスは一覧の「＋ 並行パス」で追加します。
          </p>
        </div>
      );
    }
    return (
      <div className="px-3 py-3 space-y-3 text-xs font-jp">
        {viaBranchEnd && <BranchEndHint />}
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
    if (row.parallel) {
      return (
        <div className="px-3 py-3 space-y-3 text-xs font-jp">
          <p className="text-stone-300">並行パス</p>
          <BranchColorSelect
            value={row.branchColor || ""}
            onChange={(branchColor) =>
              onPatch({ branchColor: branchColor || null })
            }
          />
        </div>
      );
    }
    const isElse = /^else$/i.test((row.label || "").trim());
    return (
      <div className="px-3 py-3 space-y-3 text-xs font-jp">
        <label className="flex items-center gap-2 text-stone-300">
          <input
            type="checkbox"
            checked={isElse}
            onChange={(e) => {
              if (e.target.checked) onPatch({ label: "else" });
              else onPatch({ label: "" });
            }}
            className="rounded border-stone-500"
          />
          else
        </label>
        {isElse ? (
          <BranchColorSelect
            value={row.branchColor || ""}
            onChange={(branchColor) =>
              onPatch({ branchColor: branchColor || null })
            }
          />
        ) : (
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
      (r) => r.kind === "branchStart" && r.id === row.loopBranchId,
    );
    return (
      <div className="px-3 py-3 text-xs font-jp text-stone-400">
        <p className="text-[10px] text-stone-500 mb-1">ループ（親の if）</p>
        <p className="text-stone-200">{parent?.cond || "—"}</p>
      </div>
    );
  }

  if (row.kind === "branchMerge") {
    const options = collectMergeTargetOptions(rows || []);
    const target = (row.mergeTarget || "").trim();
    const selectedStepIndex = options.find(
      (opt) => opt.mergeId && opt.mergeId === target,
    )?.stepIndex;
    const valid = target && options.some((opt) => opt.mergeId === target);

    function handleSelectChange(event) {
      const raw = event.target.value;
      if (raw === "") {
        onPatch({ mergeTarget: "" });
        return;
      }
      const stepIndex = Number(raw);
      const opt = options.find((o) => o.stepIndex === stepIndex);
      if (!opt) return;
      const mergeId = opt.mergeId || nextStepMergeId(rows);
      if (onMergeTargetPick) {
        onMergeTargetPick(stepIndex, mergeId);
      } else {
        onPatch({ mergeTarget: mergeId });
      }
    }

    return (
      <div className="px-3 py-3 space-y-2 text-xs font-jp">
        <div>
          <label className="block text-[10px] text-stone-500 mb-1">
            合流先ブロック
          </label>
          <select
            value={
              selectedStepIndex != null ? String(selectedStepIndex) : ""
            }
            onChange={handleSelectChange}
            className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
          >
            <option value="">— 手順を選択 —</option>
            {options.map((opt) => (
              <option key={opt.stepIndex} value={String(opt.stepIndex)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-stone-500 mb-1">
            合流 id（merge）
          </label>
          <input
            type="text"
            value={row.mergeTarget || ""}
            onChange={(e) => onPatch({ mergeTarget: e.target.value })}
            className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100 font-mono"
          />
        </div>
        {!valid && target && (
          <p className="text-[10px] text-amber-400">
            一致する id のステップがありません。上の一覧から選ぶか、合流先に
            id: を設定してください。
          </p>
        )}
        {!target && (
          <p className="text-[10px] text-stone-500">
            一覧から手順を選ぶと id が自動設定されます（未設定時は a, b, c …）。
          </p>
        )}
      </div>
    );
  }

  if (row.kind === "groupStart") {
    const isBranch = (row.groupMode ?? "branch") === "branch";
    return (
      <div className="px-3 py-3 space-y-3 text-xs font-jp">
        <p className="text-stone-300">
          {isBranch ? "支線（branch）— 本流から分岐し末尾で合流" : "枠（section）— 本流のまま点線ボックスで囲う"}
        </p>
        <div>
          <label className="block text-[10px] text-stone-500 mb-1">名前</label>
          <input
            type="text"
            value={row.sectionName || ""}
            onChange={(e) => onPatch({ sectionName: e.target.value })}
            className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
          />
        </div>
        <BranchColorSelect
          value={row.sectionColor || ""}
          onChange={(sectionColor) => onPatch({ sectionColor: sectionColor || null })}
        />
      </div>
    );
  }

  if (row.kind === "groupEnd") {
    const isBranch = (row.groupMode ?? "branch") === "branch";
    return (
      <div className="px-3 py-3 text-xs font-jp">
        <p className="text-[10px] text-stone-400 border border-stone-700/60 rounded-sm px-2 py-1.5 bg-stone-900/50">
          {isBranch
            ? "終了（end-branch）— 開始（branch）で名前・色を編集します。"
            : "終了（end-section）— 開始（section）で名前・色を編集します。"}
        </p>
      </div>
    );
  }

  return (
    <p className="text-xs font-jp text-stone-500 px-3 py-4">
      分岐行を選択してください
    </p>
  );
}

function BranchEndHint({ parallel = false }) {
  return (
    <p className="text-[10px] text-stone-400 border border-stone-700/60 rounded-sm px-2 py-1.5 bg-stone-900/50">
      {parallel
        ? "終了（endfork）— 開始（fork）と同じ設定を編集しています。"
        : "終了（endif）— 開始（if）と同じ設定を編集しています。"}
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
