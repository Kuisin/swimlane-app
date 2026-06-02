import { X } from "lucide-react";
import {
  DEFAULT_COLUMN_TITLES,
  resolveDiagramOptions,
} from "@kai-swimlane/core";

// One checkbox (show option) per group; its value inputs appear when checked.
// `title` groups write to providedColumnTitles so titles round-trip.
const GROUPS = [
  {
    opt: "showDescription",
    label: "説明（タイトル下）",
    dslKey: "show-description",
    fields: [["description", "本文", "description"]],
  },
  {
    opt: "showHeader",
    label: "ヘッダー",
    dslKey: "show-header",
    fields: [
      ["headerLeft", "左", "header-left"],
      ["headerCenter", "中央", "header-center"],
      ["headerRight", "右", "header-right"],
    ],
  },
  {
    opt: "showFooter",
    label: "フッター",
    dslKey: "show-footer",
    fields: [
      ["footerLeft", "左", "footer-left"],
      ["footerCenter", "中央", "footer-center"],
      ["footerRight", "右", "footer-right"],
    ],
  },
  {
    opt: "showLeftGutter",
    label: "左カラム（番号・ラベル・説明）",
    dslKey: "show-left-gutter",
    title: true,
    fields: [
      ["leftTitle", "見出し", "left-title"],
      ["leftSubtitle", "副見出し", "left-subtitle"],
    ],
  },
  {
    opt: "showRightGutter",
    label: "右カラム（備考 remark）",
    dslKey: "show-right-gutter",
    title: true,
    fields: [
      ["rightTitle", "見出し", "right-title"],
      ["rightSubtitle", "副見出し", "right-subtitle"],
    ],
  },
];

// Toggles with no value input.
const PLAIN_TOGGLES = [
  ["showStepBlockCaptions", "ステップ本文・ブロック参照を出力に含める", "show-step-block-captions"],
  ["mergeAtPreviousBlock", "クローズ位置を前ブロックに合わせる", "merge-at-previous-block"],
];

const inputClass =
  "w-full rounded-sm border border-stone-300 bg-white px-2 py-1 text-stone-800";

/**
 * Dedicated dialog for the document's /page/ and /option/ sections. Each show
 * option has a single checkbox; its value inputs appear when checked. Edits flow
 * through `onApply` so the values are written into the DSL itself.
 */
export function OptionsModal({ open, model, onApply, onClose }) {
  if (!open) return null;

  const options = resolveDiagramOptions(model?.options);
  const page = model?.page || {};

  const setToggle = (field, value) =>
    onApply((draft) => {
      draft.options = { ...(draft.options || {}), [field]: value };
    });

  const setPage = (field, value) =>
    onApply((draft) => {
      draft.page = { ...(draft.page || {}), [field]: value };
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
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-md border border-stone-300 bg-stone-50 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="font-jp text-sm font-bold text-stone-800">設定</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-stone-500 hover:bg-stone-200"
            aria-label="閉じる"
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-y-auto px-4 py-3 space-y-3">
          {GROUPS.map(({ opt, label, dslKey, title, fields }) => {
            const checked = Boolean(options[opt]);
            const apply = title ? setTitle : setPage;
            return (
              <div
                key={opt}
                className="text-xs font-jp text-stone-700 border-t border-stone-200 pt-3"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-stone-400"
                    checked={checked}
                    onChange={(event) => setToggle(opt, event.target.checked)}
                  />
                  <span className="flex-1">{label}</span>
                  <span className="text-[10px] text-stone-400 font-mono">{dslKey}</span>
                </label>
                {checked && (
                  <div className="ml-6 mt-1.5 space-y-1.5">
                    {fields.map(([field, fieldLabel, fieldKey]) => (
                      <label
                        key={field}
                        className="flex items-center gap-2 text-[11px]"
                      >
                        <span className="w-12 shrink-0 text-stone-500">
                          {fieldLabel}
                        </span>
                        <input
                          type="text"
                          value={
                            title
                              ? (page[field] ?? DEFAULT_COLUMN_TITLES[field] ?? "")
                              : page[field] || ""
                          }
                          placeholder={title ? DEFAULT_COLUMN_TITLES[field] || "" : fieldKey}
                          onChange={(event) => apply(field, event.target.value)}
                          className={inputClass}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="space-y-1.5 border-t border-stone-200 pt-3">
            {PLAIN_TOGGLES.map(([field, label, dslKey]) => (
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
        </div>
      </div>
    </div>
  );
}
