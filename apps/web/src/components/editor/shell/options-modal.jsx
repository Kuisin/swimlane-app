import { X } from "lucide-react";
import {
  DEFAULT_COLUMN_TITLES,
  resolveDiagramOptions,
} from "@kai-swimlane/core";

// Each value input is gated by a show option (the checkbox in front of it).
// Inputs sharing an option move together. `title` rows go to providedColumnTitles.
const FIELD_ROWS = [
  { opt: "showHeader", field: "headerLeft", label: "ヘッダー左", dslKey: "header-left" },
  { opt: "showHeader", field: "headerCenter", label: "ヘッダー中央", dslKey: "header-center" },
  { opt: "showHeader", field: "headerRight", label: "ヘッダー右", dslKey: "header-right" },
  { opt: "showFooter", field: "footerLeft", label: "フッター左", dslKey: "footer-left" },
  { opt: "showFooter", field: "footerCenter", label: "フッター中央", dslKey: "footer-center" },
  { opt: "showFooter", field: "footerRight", label: "フッター右", dslKey: "footer-right" },
  { opt: "showLeftGutter", field: "leftTitle", label: "左カラム見出し", dslKey: "left-title", title: true },
  { opt: "showLeftGutter", field: "leftSubtitle", label: "左カラム副見出し", dslKey: "left-subtitle", title: true },
  { opt: "showRightGutter", field: "rightTitle", label: "右カラム見出し", dslKey: "right-title", title: true },
  { opt: "showRightGutter", field: "rightSubtitle", label: "右カラム副見出し", dslKey: "right-subtitle", title: true },
];

// Toggles that have no value input.
const PLAIN_TOGGLES = [
  ["showStepBlockCaptions", "ステップ本文・ブロック参照を出力に含める", "show-step-block-captions"],
  ["mergeAtPreviousBlock", "クローズ位置を前ブロックに合わせる", "merge-at-previous-block"],
];

const inputClass =
  "mt-1 w-full rounded-sm border border-stone-300 bg-white px-2 py-1 text-stone-800";

/**
 * Dedicated dialog for the document's /page/ and /option/ sections. Each value
 * input has a checkbox in front of it (its show option); the input appears only
 * when checked. Edits flow through `onApply` so the values are written into the
 * DSL itself.
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
          {/* Description: always shown (no toggle). */}
          <label className="block text-xs font-jp text-stone-700">
            <span className="flex items-baseline justify-between">
              <span>説明（タイトル下）</span>
              <span className="text-[10px] text-stone-400 font-mono">description</span>
            </span>
            <input
              type="text"
              value={page.description || ""}
              onChange={(event) => setPage("description", event.target.value)}
              className={inputClass}
            />
          </label>

          {FIELD_ROWS.map(({ opt, field, label, dslKey, title }) => {
            const checked = Boolean(options[opt]);
            return (
              <div key={field} className="text-xs font-jp text-stone-700">
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
                  <input
                    type="text"
                    value={
                      title
                        ? (page[field] ?? DEFAULT_COLUMN_TITLES[field] ?? "")
                        : page[field] || ""
                    }
                    placeholder={title ? DEFAULT_COLUMN_TITLES[field] || "" : ""}
                    onChange={(event) =>
                      (title ? setTitle : setPage)(field, event.target.value)
                    }
                    className={`${inputClass} ml-6 w-[calc(100%-1.5rem)]`}
                  />
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
