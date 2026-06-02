import {
  BlockFieldWithPicker,
  PropsFieldWithPicker,
} from "./step-parts-pickers";

import { ARROW_LINE_TYPES } from "@kai-swimlane/core";
import {
  collectMergeTargetOptions,
  mergeIdIsTaken,
  nextStepMergeId,
} from "../../lib/flow-rows";

export function StepInspector({
  row,
  rows,
  rowIndex,
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

  const mergeIdValue = (row.mergeId || "").trim();
  const mergeIdDuplicate =
    mergeIdValue &&
    mergeIdIsTaken(rows || [], mergeIdValue, rowIndex ?? -1);

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
          list="step-merge-id-suggestions"
          value={row.mergeId || ""}
          placeholder={nextStepMergeId(rows || [])}
          onChange={(e) => onPatch({ mergeId: e.target.value || undefined })}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
        />
        <datalist id="step-merge-id-suggestions">
          {collectMergeTargetOptions(rows || []).map((opt) => (
            <option key={opt.stepIndex} value={opt.mergeId || opt.blockName} />
          ))}
        </datalist>
        {mergeIdDuplicate && (
          <p className="text-[10px] text-amber-400 mt-1">
            この id は他のステップと重複しています。ファイル内で一意にしてください。
          </p>
        )}
      </div>
      <div>
        <label className="block text-[10px] text-stone-500 mb-1">
          矢印の線種（このブロックの直後）
        </label>
        <select
          value={row.arrowLine || "solid"}
          onChange={(e) => {
            const v = e.target.value;
            onPatch({ arrowLine: v === "solid" ? undefined : v });
          }}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100"
        >
          {ARROW_LINE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "solid"
                ? "実線"
                : t === "dashed"
                  ? "破線"
                  : "点線"}
            </option>
          ))}
        </select>
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
