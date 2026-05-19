import { GuiSideModal } from "./gui-side-modal";
import { PropPartsPreview } from "./template-preview";
import { TemplateListPanel } from "./template-list-panel";
import { PROP_SIDE_OPTIONS } from "../../lib/parts-form-options";
import {
  ColorField,
  NumberField,
  SelectField,
  TextField,
} from "./parts-form-fields";
import {
  getDefaultTemplates,
  getInDocTemplates,
  isPropReferenced,
  mergeBlockProp,
} from "../../lib/template-catalog";
import { applyModelEdit } from "../../lib/gui-model";

export function PropsModal({
  open,
  onClose,
  templateMd,
  model,
  themeKey,
  src,
  onUpdateSrc,
}) {
  const defaults = getDefaultTemplates(templateMd);
  const inDoc = getInDocTemplates(model);

  function insertDefault(item) {
    const idMatch = item.code?.match(/<([^>]+)>/);
    const id = idMatch?.[1];
    if (id && model.props[id] && !window.confirm(`プロップ ${id} を上書きしますか？`)) {
      return;
    }
    onUpdateSrc(
      applyModelEdit(src, (draft) => mergeBlockProp(draft, item))
    );
  }

  function patchProp(propId, patch) {
    onUpdateSrc(
      applyModelEdit(src, (draft) => {
        draft.props[propId] = { ...draft.props[propId], ...patch };
      })
    );
  }

  function deleteProp(propId) {
    if (isPropReferenced(model, propId)) return;
    onUpdateSrc(
      applyModelEdit(src, (draft) => {
        delete draft.props[propId];
      })
    );
  }

  function addProp() {
    const id = `PROP_${Date.now()}`;
    onUpdateSrc(
      applyModelEdit(src, (draft) => {
        draft.props[id] = { id, label: id, side: "right" };
      })
    );
  }

  return (
    <GuiSideModal title="プロップ" open={open} onClose={onClose}>
      <TemplateListPanel
        defaultItems={defaults.props}
        docItems={inDoc.props}
        onAddDoc={addProp}
        addDocLabel="プロップを追加"
        renderListItem={(item, tab) =>
          tab === "default" ? (
            <span className="truncate font-jp">{item.title}</span>
          ) : (
            <span className="font-jp text-[11px] truncate">
              {item.label || item.id}
              <span className="text-stone-400 text-[10px]">
                {" "}
                · {item.side === "left" ? "左" : "右"}
              </span>
            </span>
          )
        }
        renderDetail={(item, tab) =>
          tab === "default" ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-jp">{item.title}</h3>
              <PropPartsPreview code={item.code} themeKey={themeKey} />
              <pre className="text-[10px] font-mono bg-stone-900 text-stone-100 p-3 rounded overflow-auto max-h-40">
                {item.code}
              </pre>
              <button
                type="button"
                onClick={() => insertDefault(item)}
                className="text-xs font-jp px-3 py-1.5 border border-stone-300 rounded hover:bg-stone-100"
              >
                挿入
              </button>
            </div>
          ) : (
            <PropForm
              prop={item}
              themeKey={themeKey}
              referenced={isPropReferenced(model, item.id)}
              onPatch={(patch) => patchProp(item.id, patch)}
              onDelete={() => deleteProp(item.id)}
            />
          )
        }
      />
    </GuiSideModal>
  );
}

function PropForm({ prop, referenced, onPatch, onDelete, themeKey }) {
  return (
    <div className="space-y-2 text-xs font-jp">
      <PropPartsPreview prop={prop} themeKey={themeKey} />
      <TextField
        label="label"
        value={prop.label}
        onChange={(label) => onPatch({ label })}
      />
      <SelectField
        label="side"
        value={prop.side || "right"}
        onChange={(side) => onPatch({ side })}
        options={PROP_SIDE_OPTIONS}
      />
      <ColorField
        label="background-color"
        value={prop.bg}
        onChange={(bg) => onPatch({ bg })}
      />
      <ColorField
        label="border-color"
        value={prop.borderColor}
        onChange={(borderColor) => onPatch({ borderColor })}
      />
      <ColorField
        label="text-color"
        value={prop.textColor}
        onChange={(textColor) => onPatch({ textColor })}
      />
      <TextField
        label="title / hint"
        value={prop.title}
        onChange={(title) => onPatch({ title })}
      />
      <NumberField
        label="max-chars"
        value={prop.maxChars}
        onChange={(maxChars) => onPatch({ maxChars })}
      />
      <button
        type="button"
        disabled={referenced}
        onClick={onDelete}
        className="text-xs text-red-700 border border-red-300 px-2 py-1 rounded disabled:opacity-40"
      >
        削除
      </button>
    </div>
  );
}
