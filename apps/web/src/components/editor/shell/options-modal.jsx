import { X } from "lucide-react";
import {
  DEFAULT_COLUMN_TITLES,
  resolveDiagramOptions,
} from "@kai-swimlane/core";

const TOGGLES = [
  ["showLeftGutter", "左カラム（番号・ラベル・説明）を表示", "show-left-gutter"],
  [
    "showStepBlockCaptions",
    "ステップ本文・ブロック参照を出力に含める",
    "show-step-block-captions",
  ],
  [
    "mergeAtPreviousBlock",
    "クローズ位置を前ブロックに合わせる",
    "merge-at-previous-block",
  ],
];

const TITLES = [
  ["leftTitle", "左カラム見出し", "left-title"],
  ["leftSubtitle", "左カラム副見出し", "left-subtitle"],
  ["rightTitle", "右カラム見出し（備考）", "right-title"],
  ["rightSubtitle", "右カラム副見出し", "right-subtitle"],
];

/**
 * Dedicated dialog for the document's /option/ section: display toggles and the
 * gutter column titles. Edits flow through `onApply` (a model-edit callback) so
 * the values are written into the DSL itself.
 */
export function OptionsModal({ open, model, onApply, onClose }) {
  if (!open) return null;

  const options = resolveDiagramOptions(model?.options);
  const page = model?.page || {};

  const setToggle = (field, value) =>
    onApply((draft) => {
      draft.options = { ...(draft.options || {}), [field]: value };
    });

  const setTitle = (field, value) =>
    onApply((draft) => {
      draft.page = { ...(draft.page || {}), [field]: value };
      draft.providedColumnTitles = [
        ...new Set([...(draft.providedColumnTitles || []), field]),
      ];
    });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-md border border-stone-300 bg-stone-50 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="font-jp text-sm font-bold text-stone-800">図オプション</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-stone-500 hover:bg-stone-200"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </header>

        <div className="px-4 py-3 space-y-4">
          <div className="space-y-1.5">
            {TOGGLES.map(([field, label, dslKey]) => (
              <label
                key={field}
                className="flex items-start gap-2 text-xs font-jp text-stone-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-stone-400"
                  checked={Boolean(options[field])}
                  onChange={(event) => setToggle(field, event.target.checked)}
                />
                <span>
                  {label}
                  <span className="block text-[10px] text-stone-400 font-mono">
                    {dslKey}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="space-y-2 border-t border-stone-200 pt-3">
            <p className="text-[10px] font-jp text-stone-500">カラム見出し</p>
            {TITLES.map(([field, label, dslKey]) => (
              <label key={field} className="block text-xs font-jp text-stone-700">
                <span className="flex items-baseline justify-between">
                  <span>{label}</span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {dslKey}
                  </span>
                </span>
                <input
                  type="text"
                  value={page[field] ?? DEFAULT_COLUMN_TITLES[field] ?? ""}
                  placeholder={DEFAULT_COLUMN_TITLES[field] || ""}
                  onChange={(event) => setTitle(field, event.target.value)}
                  className="mt-0.5 w-full rounded-sm border border-stone-300 bg-white px-2 py-1 text-stone-800"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
