import { GuiSideModal } from "./gui-side-modal";
import { PropPartsPreview } from "./template-preview";
import { TemplateListPanel } from "./template-list-panel";
import { DraftTemplateForm } from "./draft-template-form";
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
import { useUnsavedGuard } from "../../hooks/use-unsaved-guard";

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
  const { onDirtyChange, guardUnsaved } = useUnsavedGuard();

  function handleClose() {
    if (!guardUnsaved()) return;
    onClose();
  }

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

  function saveProp(draft) {
    onUpdateSrc(
      applyModelEdit(src, (m) => {
        m.props[draft.id] = { ...draft };
      })
    );
  }

  function deleteProp(propId) {
    if (isPropReferenced(model, propId)) return;
    if (!window.confirm("このプロップを削除しますか？")) return;
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
    <GuiSideModal title="プロップ" open={open} onClose={handleClose}>
      <TemplateListPanel
        defaultItems={defaults.props}
        docItems={inDoc.props}
        onAddDoc={addProp}
        addDocLabel="プロップを追加"
        guardUnsaved={guardUnsaved}
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
            <DraftTemplateForm
              key={item.id}
              item={item}
              referenced={isPropReferenced(model, item.id)}
              onDirtyChange={onDirtyChange}
              onSave={saveProp}
              onDelete={() => deleteProp(item.id)}
            >
              {({ draft, patch }) => (
                <PropForm prop={draft} themeKey={themeKey} onPatch={patch} />
              )}
            </DraftTemplateForm>
          )
        }
      />
    </GuiSideModal>
  );
}

function PropForm({ prop, onPatch, themeKey }) {
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
    </div>
  );
}
