import { createElement, useState } from "react";
import { getLucideIcon } from "@kai-swimlane/core";
import { ICON_OPTIONS } from "../../lib/parts-form-options";
import { COLOR_PRESET_GROUPS, normalizeHexColor } from "../../lib/color-presets";

function normalizeHexForPicker(value) {
  return normalizeHexColor(value) || "#000000";
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[10px] text-stone-500 font-jp">{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded px-2 py-1 text-[11px] bg-white";

export function TextField({ label, value, onChange, readOnly, mono = false }) {
  return (
    <Field label={label}>
      <input
        type="text"
        value={value ?? ""}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value || null)}
        className={`${inputClass} ${mono ? "font-mono" : "font-jp"} ${readOnly ? "bg-stone-100" : ""}`}
      />
    </Field>
  );
}

export function NumberField({ label, value, onChange, min = 1 }) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        value={value ?? ""}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isNaN(n) ? undefined : n);
        }}
        className={`${inputClass} font-mono`}
      />
    </Field>
  );
}

export function ColorField({ label, value, onChange }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pickerValue = normalizeHexForPicker(value);
  const displayColor = normalizeHexColor(value) || "#ffffff";

  return (
    <Field label={label}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 shrink-0 rounded border border-stone-300"
            style={{ background: displayColor }}
            aria-hidden
          />
          <span className="font-mono text-[11px] text-stone-700 min-w-0 truncate flex-1">
            {value?.trim() || "—"}
          </span>
          <button
            type="button"
            onClick={() => setPaletteOpen((open) => !open)}
            className="shrink-0 text-[10px] font-jp text-stone-500 hover:text-stone-800 underline"
            aria-expanded={paletteOpen}
          >
            {paletteOpen ? "パレットを閉じる" : "パレット"}
          </button>
        </div>

        {paletteOpen && <ColorSwatchGrid value={value} onChange={onChange} />}

        <div className="flex gap-2 items-center pt-1 border-t border-stone-200">
          <span className="text-[9px] text-stone-400 font-jp shrink-0">カスタム</span>
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-10 shrink-0 cursor-pointer rounded border border-stone-300 bg-white p-0.5"
            aria-label={`${label} custom color picker`}
          />
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="#000000"
            className={`${inputClass} font-mono flex-1 min-w-0`}
            aria-label={`${label} hex`}
          />
        </div>
      </div>
    </Field>
  );
}

function ColorSwatchGrid({ value, onChange }) {
  const current = normalizeHexColor(value);

  return (
    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5">
      {COLOR_PRESET_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="text-[9px] text-stone-400 font-jp mb-1">{group.label}</p>
          <div className="flex flex-wrap gap-1">
            {group.colors.map((color) => {
              const isActive =
                current && normalizeHexColor(color.value) === current;
              return (
                <button
                  key={`${group.id}-${color.value}`}
                  type="button"
                  title={`${color.label} ${color.value}`}
                  onClick={() => onChange(color.value)}
                  className={`w-5 h-5 rounded-sm border shrink-0 transition ${
                    isActive
                      ? "ring-2 ring-stone-800 ring-offset-1 border-stone-800"
                      : "border-stone-300 hover:scale-110"
                  }`}
                  style={{ background: color.value }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SelectField({ label, value, onChange, options, allowEmpty, emptyLabel = "（なし）" }) {
  return (
    <Field label={label}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={`${inputClass} font-jp`}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function normalizeIconValue(value) {
  if (!value) return "";
  const v = value.trim();
  if (v.startsWith("#")) return v;
  return `#${v}`;
}

function lucideNameFromValue(value) {
  const normalized = normalizeIconValue(value);
  return normalized ? normalized.slice(1) : "";
}

function LucideIconPreview({ name, size = 18, className = "" }) {
  const icon = name ? getLucideIcon(name) : null;
  if (!icon) return null;
  // createElement (not <Icon/>) so the lint rule doesn't see a component
  // "created during render" from the per-render getLucideIcon() lookup.
  return createElement(icon, { size, strokeWidth: 2, className, "aria-hidden": true });
}

export function LucideIconMark({ icon, size = 18, className = "" }) {
  if (!icon?.trim()) return null;
  const name = lucideNameFromValue(icon);
  if (name && getLucideIcon(name)) {
    return <LucideIconPreview name={name} size={size} className={className} />;
  }
  const display = icon.startsWith("#") ? icon.slice(1) : icon;
  return (
    <span className={className} style={{ fontSize: size }} aria-hidden>
      {display}
    </span>
  );
}

function IconSwatchGrid({ value, onChange }) {
  const current = lucideNameFromValue(value);

  return (
    <div className="max-h-36 overflow-y-auto pr-0.5">
      <div className="flex flex-wrap gap-1">
        {ICON_OPTIONS.map((opt) => {
          const name = opt.value.slice(1);
          const isActive = current === name;
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              onClick={() => onChange(opt.value)}
              className={`w-8 h-8 rounded-sm border shrink-0 flex items-center justify-center transition ${
                isActive
                  ? "ring-2 ring-stone-800 ring-offset-1 border-stone-800 bg-stone-100"
                  : "border-stone-300 bg-white hover:bg-stone-50 hover:scale-105"
              }`}
            >
              <LucideIconPreview name={name} size={16} className="text-stone-700" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function IconSelectField({ label, value, onChange }) {
  const [gridOpen, setGridOpen] = useState(false);
  const normalized = normalizeIconValue(value);
  const iconName = lucideNameFromValue(value);

  return (
    <Field label={label}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 shrink-0 rounded border border-stone-300 bg-stone-50 flex items-center justify-center"
            aria-hidden
          >
            {iconName ? (
              <LucideIconPreview name={iconName} className="text-stone-700" />
            ) : (
              <span className="text-[9px] text-stone-400 font-jp">—</span>
            )}
          </span>
          <select
            value={normalized}
            onChange={(e) => onChange(e.target.value || null)}
            className={`${inputClass} font-jp flex-1 min-w-0`}
          >
            <option value="">（アイコンなし）</option>
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setGridOpen((open) => !open)}
            className="shrink-0 text-[10px] font-jp text-stone-500 hover:text-stone-800 underline"
            aria-expanded={gridOpen}
          >
            {gridOpen ? "一覧を閉じる" : "一覧"}
          </button>
        </div>
        {gridOpen && <IconSwatchGrid value={value} onChange={onChange} />}
      </div>
    </Field>
  );
}
