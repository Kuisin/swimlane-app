import { ICON_OPTIONS } from "../../lib/parts-form-options";
import {
  COLOR_PRESET_GROUPS,
  findMatchingPresetValue,
  normalizeHexColor,
} from "../../lib/color-presets";

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
  const pickerValue = normalizeHexForPicker(value);
  const presetMatch = findMatchingPresetValue(value);

  return (
    <Field label={label}>
      <div className="space-y-2">
        <select
          value={presetMatch}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className={`${inputClass} font-jp w-full`}
          aria-label={`${label} preset`}
        >
          <option value="">プリセットから選択…</option>
          {COLOR_PRESET_GROUPS.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.colors.map((color) => (
                <option key={`${group.id}-${color.value}`} value={color.value}>
                  {color.label} ({color.value})
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <ColorSwatchGrid value={value} onChange={onChange} />

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

export function IconSelectField({ label, value, onChange }) {
  return (
    <SelectField
      label={label}
      value={normalizeIconValue(value)}
      onChange={onChange}
      options={ICON_OPTIONS}
      allowEmpty
      emptyLabel="（アイコンなし）"
    />
  );
}
