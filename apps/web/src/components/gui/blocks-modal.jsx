import { GuiSideModal } from "./gui-side-modal";
import { BlockPartsPreview } from "./template-preview";
import { TemplateListPanel } from "./template-list-panel";
import { BLOCK_SHAPE_OPTIONS } from "../../lib/parts-form-options";
import {
  ColorField,
  IconSelectField,
  SelectField,
  TextField,
} from "./parts-form-fields";
import {
  getDefaultTemplates,
  getInDocTemplates,
  isBlockReferenced,
  mergeBlockProp,
} from "../../lib/template-catalog";
import { applyModelEdit } from "../../lib/gui-model";

export function BlocksModal({
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
    if (id && model.blocks[id] && !window.confirm(`ブロック ${id} を上書きしますか？`)) {
      return;
    }
    onUpdateSrc(
      applyModelEdit(src, (draft) => mergeBlockProp(draft, item))
    );
  }

  function patchBlock(blockId, patch) {
    onUpdateSrc(
      applyModelEdit(src, (draft) => {
        draft.blocks[blockId] = { ...draft.blocks[blockId], ...patch };
      })
    );
  }

  function deleteBlock(blockId) {
    if (isBlockReferenced(model, blockId)) return;
    onUpdateSrc(
      applyModelEdit(src, (draft) => {
        delete draft.blocks[blockId];
      })
    );
  }

  function addBlock() {
    const id = `block_${Date.now()}`;
    onUpdateSrc(
      applyModelEdit(src, (draft) => {
        draft.blocks[id] = {
          id,
          label: id,
          bg: "#dbeafe",
          textColor: "#1e40af",
          borderColor: "#2563eb",
          shape: "rounded",
        };
      })
    );
  }

  return (
    <GuiSideModal title="ブロック" open={open} onClose={onClose}>
      <TemplateListPanel
        defaultItems={defaults.blocks}
        docItems={inDoc.blocks}
        onAddDoc={addBlock}
        addDocLabel="ブロックを追加"
        renderListItem={(item, tab) =>
          tab === "default" ? (
            <span className="truncate font-jp">{item.title}</span>
          ) : (
            <span className="flex items-center gap-1.5 truncate font-jp text-[11px]">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0 border border-stone-300"
                style={{ background: item.bg || "#ccc" }}
              />
              <span className="truncate">{item.label || item.id}</span>
            </span>
          )
        }
        renderDetail={(item, tab) =>
          tab === "default" ? (
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-jp">{item.title}</h3>
              <BlockPartsPreview code={item.code} themeKey={themeKey} />
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
            <BlockForm
              block={item}
              themeKey={themeKey}
              referenced={isBlockReferenced(model, item.id)}
              onPatch={(patch) => patchBlock(item.id, patch)}
              onDelete={() => deleteBlock(item.id)}
            />
          )
        }
      />
    </GuiSideModal>
  );
}

function BlockForm({ block, referenced, onPatch, onDelete, themeKey }) {
  return (
    <div className="space-y-2 text-xs">
      <BlockPartsPreview block={block} themeKey={themeKey} />
      <TextField
        label="label"
        value={block.label}
        onChange={(label) => onPatch({ label })}
      />
      <ColorField
        label="background-color"
        value={block.bg}
        onChange={(bg) => onPatch({ bg })}
      />
      <ColorField
        label="text-color"
        value={block.textColor}
        onChange={(textColor) => onPatch({ textColor })}
      />
      <ColorField
        label="border-color"
        value={block.borderColor}
        onChange={(borderColor) => onPatch({ borderColor })}
      />
      <SelectField
        label="shape"
        value={block.shape || "rounded"}
        onChange={(shape) => onPatch({ shape })}
        options={BLOCK_SHAPE_OPTIONS}
      />
      <IconSelectField
        label="icon"
        value={block.icon}
        onChange={(icon) => onPatch({ icon })}
      />
      <button
        type="button"
        disabled={referenced}
        onClick={onDelete}
        className="text-xs text-red-700 border border-red-300 px-2 py-1 rounded disabled:opacity-40 font-jp"
      >
        削除
      </button>
    </div>
  );
}
