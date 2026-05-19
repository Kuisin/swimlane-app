import { useEffect } from "react";
import { BlockPartsPreview } from "./template-preview";
import { TemplateListPanel } from "./template-list-panel";
import { DraftTemplateForm } from "./draft-template-form";
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
import { useUnsavedGuard } from "../../hooks/use-unsaved-guard";
import { useEditor } from "../../hooks/use-editor";

export function BlocksTemplatePanel({ registerGuardUnsaved }) {
  const { templateMd, model, themeKey, src, updateActiveDocumentSrc } = useEditor();
  const defaults = getDefaultTemplates(templateMd);
  const inDoc = getInDocTemplates(model);
  const { onDirtyChange, guardUnsaved } = useUnsavedGuard();

  useEffect(() => {
    registerGuardUnsaved?.(guardUnsaved);
  }, [guardUnsaved, registerGuardUnsaved]);

  function insertDefault(item) {
    const idMatch = item.code?.match(/<([^>]+)>/);
    const id = idMatch?.[1];
    if (id && model.blocks[id] && !window.confirm(`ブロック ${id} を上書きしますか？`)) {
      return;
    }
    updateActiveDocumentSrc(
      applyModelEdit(src, (draft) => mergeBlockProp(draft, item))
    );
  }

  function saveBlock(draft) {
    updateActiveDocumentSrc(
      applyModelEdit(src, (m) => {
        m.blocks[draft.id] = { ...draft };
      })
    );
  }

  function deleteBlock(blockId) {
    if (isBlockReferenced(model, blockId)) return;
    if (!window.confirm("このブロックを削除しますか？")) return;
    updateActiveDocumentSrc(
      applyModelEdit(src, (draft) => {
        delete draft.blocks[blockId];
      })
    );
  }

  function addBlock() {
    const id = `block_${Date.now()}`;
    updateActiveDocumentSrc(
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
    <TemplateListPanel
      defaultItems={defaults.blocks}
      docItems={inDoc.blocks}
      onAddDoc={addBlock}
      addDocLabel="ブロックを追加"
      guardUnsaved={guardUnsaved}
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
          <DraftTemplateForm
            key={item.id}
            item={item}
            referenced={isBlockReferenced(model, item.id)}
            onDirtyChange={onDirtyChange}
            onSave={saveBlock}
            onDelete={() => deleteBlock(item.id)}
          >
            {({ draft, patch }) => (
              <BlockForm block={draft} themeKey={themeKey} onPatch={patch} />
            )}
          </DraftTemplateForm>
        )
      }
    />
  );
}

function BlockForm({ block, onPatch, themeKey }) {
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
    </div>
  );
}
