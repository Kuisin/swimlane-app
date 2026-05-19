import { useState } from "react";
import { BlockPartsPreview, PropPartsPreview } from "./template-preview";
import { PreviewPickModal } from "./preview-pick-modal";

const selectClass =
  "w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 text-stone-100";

const compactPreviewClass =
  "rounded border border-stone-600 overflow-auto max-h-36 mb-0 bg-white";

function PreviewOpenButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-1.5 text-[10px] font-jp text-stone-400 hover:text-stone-200 underline disabled:opacity-40 disabled:no-underline"
    >
      プレビューから選択…
    </button>
  );
}

export function BlockFieldWithPicker({ value, blocks, themeKey, onChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const blockList = Object.values(blocks || {});

  function selectBlock(blockId) {
    onChange(blockId);
    setModalOpen(false);
  }

  return (
    <div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={selectClass}
      >
        <option value="">（なし）</option>
        {blockList.map((block) => (
          <option key={block.id} value={block.id}>
            {block.label || block.id}
          </option>
        ))}
      </select>

      <PreviewOpenButton
        disabled={blockList.length === 0}
        onClick={() => setModalOpen(true)}
      />

      <PreviewPickModal
        title="ブロックを選択"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        {blockList.map((block) => {
          const selected = value === block.id;
          return (
            <PreviewPickCard
              key={block.id}
              title={block.label || block.id}
              subtitle={block.id}
              selected={selected}
              selectLabel={selected ? "選択中" : "このデザインを選ぶ"}
              onSelect={() => selectBlock(block.id)}
            >
              <BlockPartsPreview
                block={block}
                themeKey={themeKey}
                className={compactPreviewClass}
              />
            </PreviewPickCard>
          );
        })}
      </PreviewPickModal>
    </div>
  );
}

export function PropsFieldWithPicker({ value, props, themeKey, onChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const selected = value || [];
  const propList = Object.values(props || {});

  function toggleProp(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = [...next];
    onChange(ids.length ? ids : undefined);
  }

  const commaValue = selected.join(",");

  return (
    <div className="space-y-2">
      {propList.length > 0 ? (
        <ul className="max-h-32 overflow-y-auto rounded-sm border border-stone-600 bg-stone-800/80 divide-y divide-stone-700">
          {propList.map((prop) => {
            const checked = selected.includes(prop.id);
            return (
              <li key={prop.id}>
                <label className="flex items-start gap-2 px-2 py-1.5 cursor-pointer hover:bg-stone-700/40">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProp(prop.id)}
                    className="mt-0.5 rounded border-stone-500 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-stone-100 truncate">
                      {prop.label || prop.id}
                    </span>
                    <span className="block font-mono text-[9px] text-stone-500 truncate">
                      {prop.id}
                      {prop.side ? ` · ${prop.side === "left" ? "左" : "右"}` : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[10px] text-stone-500 font-jp">
          プロップがありません。ツールバーの「プロップ」から追加してください。
        </p>
      )}

      <PreviewOpenButton
        disabled={propList.length === 0}
        onClick={() => setModalOpen(true)}
      />

      <PreviewPickModal
        title="プロップを選択"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <p className="text-[10px] text-stone-400 font-jp -mt-1 mb-1">
          複数選択できます。背景をクリックするか Esc で閉じます。
        </p>
        {propList.map((prop) => {
          const isOn = selected.includes(prop.id);
          return (
            <PreviewPickCard
              key={prop.id}
              title={prop.label || prop.id}
              subtitle={`${prop.id}${prop.side ? ` · ${prop.side}` : ""}`}
              selected={isOn}
              selectLabel={isOn ? "選択を解除" : "追加"}
              onSelect={() => toggleProp(prop.id)}
            >
              <PropPartsPreview
                prop={prop}
                themeKey={themeKey}
                className={compactPreviewClass}
              />
            </PreviewPickCard>
          );
        })}
      </PreviewPickModal>

      <div>
        <label className="block text-[9px] text-stone-500 mb-0.5 font-jp">
          IDを直接入力（カンマ区切り）
        </label>
        <input
          type="text"
          value={commaValue}
          onChange={(e) => {
            const ids = e.target.value
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean);
            onChange(ids.length ? ids : undefined);
          }}
          className="w-full rounded-sm border border-stone-600 bg-stone-800 px-2 py-1.5 font-mono text-[11px] text-stone-100"
          placeholder="prop_a,prop_b"
        />
      </div>
    </div>
  );
}

function PreviewPickCard({
  title,
  subtitle,
  selected,
  selectLabel,
  onSelect,
  children,
}) {
  return (
    <div
      className={`rounded-sm border p-2 ${
        selected ? "border-blue-500/60 bg-blue-950/30" : "border-stone-600"
      }`}
    >
      {children}
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <div className="min-w-0">
          <p className="text-[11px] font-jp text-stone-200 truncate">{title}</p>
          <p className="font-mono text-[9px] text-stone-500 truncate">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onSelect}
          className={`shrink-0 text-[10px] font-jp px-2 py-1 rounded border ${
            selected
              ? "border-blue-400/50 text-blue-200 hover:bg-blue-900/30"
              : "border-stone-500 text-stone-200 hover:bg-stone-700"
          }`}
        >
          {selectLabel}
        </button>
      </div>
    </div>
  );
}
