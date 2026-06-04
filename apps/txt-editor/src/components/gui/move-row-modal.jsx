import { useMemo } from "react";
import { getMoveToTargets, rowSummaryText } from "../../lib/flow-rows";
import { PreviewPickModal } from "./preview-pick-modal";

export function MoveRowModal({
  open,
  fromIndex,
  rows,
  lanes,
  onClose,
  onPick,
}) {
  const options = useMemo(
    () =>
      fromIndex != null ? getMoveToTargets(rows, fromIndex, lanes) : [],
    [rows, fromIndex, lanes]
  );

  const movingSummary =
    fromIndex != null ? rowSummaryText(rows[fromIndex], lanes) : "";

  return (
    <PreviewPickModal
      title="移動先を選択"
      open={open}
      onClose={onClose}
    >
      {fromIndex != null && (
        <p className="text-[11px] text-stone-400 font-jp">
          移動する行:{" "}
          <span className="text-stone-200">{movingSummary || "（行）"}</span>
        </p>
      )}
      {options.length === 0 ? (
        <p className="text-xs text-stone-500 font-jp py-2">
          移動できる位置がありません。
        </p>
      ) : (
        <ul className="space-y-1">
          {options.map((opt) => (
            <li key={opt.insertBefore}>
              <button
                type="button"
                onClick={() => onPick(opt.insertBefore)}
                className="w-full text-left px-3 py-2 rounded border border-stone-700 text-xs font-jp text-stone-100 hover:bg-stone-800 hover:border-stone-500"
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </PreviewPickModal>
  );
}
