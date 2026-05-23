import { useEditor } from "../../../hooks/use-editor";
import { applyModelEdit } from "../../../lib/gui-model";
import {
  getDefaultTemplates,
  getInDocTemplates,
  isBlockReferenced,
  isLaneReferenced,
  isPropReferenced,
  mergeBlockProp,
  mergeRole,
} from "../../../lib/template-catalog";
import { BLOCK_SHAPE_OPTIONS, PROP_SIDE_OPTIONS } from "../../../lib/parts-form-options";
import {
  ColorField,
  IconSelectField,
  NumberField,
  SelectField,
  TextField,
} from "../parts-form-fields";
import { DraftTemplateForm } from "./draft-form";
import { TemplateListPanel } from "./list-panel";
import {
  BlockPartsPreview,
  PropPartsPreview,
  RoleCodePreview,
  RoleLanePreview,
  SetDiagramPreview,
} from "./preview";
import {
  confirmOverwriteId,
  extractPartId,
  useTemplatePanelGuard,
} from "./common";
import { ColorSwatch, DefaultTemplateDetail } from "./shared-ui";

function useTemplateEditor() {
  const editor = useEditor();
  return {
    ...editor,
    edit: (fn) => editor.updateActiveDocumentSrc(applyModelEdit(editor.src, fn)),
  };
}

export function BlocksTemplatePanel({ registerGuardUnsaved }) {
  const { templateMd, model, themeKey, edit } = useTemplateEditor();
  const defaults = getDefaultTemplates(templateMd);
  const inDoc = getInDocTemplates(model);
  const { onDirtyChange, guardUnsaved } = useTemplatePanelGuard(registerGuardUnsaved);

  function insertDefault(item) {
    const id = extractPartId(item.code);
    if (!confirmOverwriteId(id && model.blocks[id], `ブロック ${id}`)) return;
    edit((draft) => mergeBlockProp(draft, item));
  }

  return (
    <TemplateListPanel
      defaultItems={defaults.blocks}
      docItems={inDoc.blocks}
      onAddDoc={() => {
        const id = `block_${Date.now()}`;
        edit((draft) => {
          draft.blocks[id] = {
            id,
            label: id,
            bg: "#dbeafe",
            textColor: "#1e40af",
            borderColor: "#2563eb",
            shape: "rounded",
          };
        });
      }}
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
          <DefaultTemplateDetail
            item={item}
            preview={<BlockPartsPreview code={item.code} themeKey={themeKey} />}
            onInsert={() => insertDefault(item)}
          />
        ) : (
          <DraftTemplateForm
            key={item.id}
            item={item}
            referenced={isBlockReferenced(model, item.id)}
            onDirtyChange={onDirtyChange}
            onSave={(draft) => edit((m) => { m.blocks[draft.id] = { ...draft }; })}
            onDelete={() => {
              if (isBlockReferenced(model, item.id)) return;
              if (!window.confirm("このブロックを削除しますか？")) return;
              edit((draft) => { delete draft.blocks[item.id]; });
            }}
          >
            {({ draft, patch }) => (
              <div className="space-y-2 text-xs">
                <BlockPartsPreview block={draft} themeKey={themeKey} />
                <TextField label="label" value={draft.label} onChange={(label) => patch({ label })} />
                <ColorField label="background-color" value={draft.bg} onChange={(bg) => patch({ bg })} />
                <ColorField label="text-color" value={draft.textColor} onChange={(textColor) => patch({ textColor })} />
                <ColorField label="border-color" value={draft.borderColor} onChange={(borderColor) => patch({ borderColor })} />
                <SelectField label="shape" value={draft.shape || "rounded"} onChange={(shape) => patch({ shape })} options={BLOCK_SHAPE_OPTIONS} />
                <IconSelectField label="icon" value={draft.icon} onChange={(icon) => patch({ icon })} />
              </div>
            )}
          </DraftTemplateForm>
        )
      }
    />
  );
}

export function RolesTemplatePanel({ registerGuardUnsaved }) {
  const { templateMd, model, themeKey, edit, replaceActiveDocumentSrc } = useTemplateEditor();
  const defaults = getDefaultTemplates(templateMd);
  const inDoc = getInDocTemplates(model);
  const { onDirtyChange, guardUnsaved } = useTemplatePanelGuard(registerGuardUnsaved);

  function insertDefault(item) {
    if (
      model.lanes.some((l) => l.id && item.code?.includes(`<${l.id}>`)) &&
      !window.confirm("同名の役割があります。上書きしますか？")
    ) {
      return;
    }
    edit((draft) => mergeRole(draft, item));
  }

  function replaceDocument(code) {
    if (!window.confirm("現在のドキュメントをテンプレートで置き換えます。よろしいですか？")) {
      return;
    }
    replaceActiveDocumentSrc(code);
  }

  return (
    <TemplateListPanel
      defaultItems={[...defaults.roles, ...defaults.sets.map((s) => ({ ...s, isSet: true }))]}
      docItems={inDoc.roles}
      onAddDoc={() => {
        const id = `role_${Date.now()}`;
        edit((draft) => {
          draft.lanes.push({ id, label: "新しい役割", textColor: "#1e293b", bg: "#ffffff" });
        });
      }}
      addDocLabel="役割を追加"
      guardUnsaved={guardUnsaved}
      onReorderDocItem={(lane, direction) => {
        edit((draft) => {
          const idx = draft.lanes.findIndex((l) => l.id === lane.id);
          if (idx < 0) return;
          const target = direction === "up" ? idx - 1 : idx + 1;
          if (target < 0 || target >= draft.lanes.length) return;
          const next = [...draft.lanes];
          [next[idx], next[target]] = [next[target], next[idx]];
          draft.lanes = next;
        });
      }}
      docReorderHint="上＝左のレーン、下＝右のレーン（↑↓で並べ替え）"
      renderListItem={(item, tab) =>
        tab === "default" ? (
          <span className="font-jp truncate">
            {item.isSet ? "📋 " : ""}
            {item.title}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 truncate">
            <ColorSwatch color={item.bg} />
            <span>{item.label || item.id}</span>
          </span>
        )
      }
      renderDetail={(item, tab) =>
        tab === "default" ? (
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-jp">{item.title}</h3>
            {item.desc && <p className="text-xs text-stone-600 font-jp">{item.desc}</p>}
            {item.isSet ? (
              <SetDiagramPreview code={item.code} themeKey={themeKey} />
            ) : (
              <RoleCodePreview code={item.code} />
            )}
            <pre className="text-[10px] font-mono bg-stone-900 text-stone-100 p-3 rounded overflow-auto max-h-48">
              {item.code}
            </pre>
            <button
              type="button"
              onClick={() => (item.isSet ? replaceDocument(item.code) : insertDefault(item))}
              className="text-xs font-jp px-3 py-1.5 border border-stone-300 rounded hover:bg-stone-100"
            >
              {item.isSet ? "フルテンプレートで置換" : "挿入"}
            </button>
          </div>
        ) : (
          <DraftTemplateForm
            key={item.id}
            item={item}
            referenced={isLaneReferenced(model, item.id)}
            onDirtyChange={onDirtyChange}
            onSave={(draft) => edit((m) => {
              const idx = m.lanes.findIndex((l) => l.id === draft.id);
              if (idx >= 0) m.lanes[idx] = { ...draft };
            })}
            onDelete={() => {
              if (isLaneReferenced(model, item.id)) return;
              if (!window.confirm("この役割を削除しますか？")) return;
              edit((draft) => { draft.lanes = draft.lanes.filter((l) => l.id !== item.id); });
            }}
          >
            {({ draft, patch }) => (
              <div className="space-y-2 text-xs font-jp">
                <RoleLanePreview lane={draft} />
                <TextField label="ID" value={draft.id} readOnly mono onChange={() => {}} />
                <TextField label="label" value={draft.label} onChange={(label) => patch({ label })} />
                <ColorField label="text-color" value={draft.textColor} onChange={(textColor) => patch({ textColor })} />
                <ColorField label="background-color" value={draft.bg} onChange={(bg) => patch({ bg })} />
                <IconSelectField label="icon" value={draft.icon} onChange={(icon) => patch({ icon })} />
              </div>
            )}
          </DraftTemplateForm>
        )
      }
    />
  );
}

export function PropsTemplatePanel({ registerGuardUnsaved }) {
  const { templateMd, model, themeKey, edit } = useTemplateEditor();
  const defaults = getDefaultTemplates(templateMd);
  const inDoc = getInDocTemplates(model);
  const { onDirtyChange, guardUnsaved } = useTemplatePanelGuard(registerGuardUnsaved);

  function insertDefault(item) {
    const id = extractPartId(item.code);
    if (!confirmOverwriteId(id && model.props[id], `プロップ ${id}`)) return;
    edit((draft) => mergeBlockProp(draft, item));
  }

  return (
    <TemplateListPanel
      defaultItems={defaults.props}
      docItems={inDoc.props}
      onAddDoc={() => {
        const id = `PROP_${Date.now()}`;
        edit((draft) => { draft.props[id] = { id, label: id, side: "right" }; });
      }}
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
          <DefaultTemplateDetail
            item={item}
            preview={<PropPartsPreview code={item.code} themeKey={themeKey} />}
            onInsert={() => insertDefault(item)}
          />
        ) : (
          <DraftTemplateForm
            key={item.id}
            item={item}
            referenced={isPropReferenced(model, item.id)}
            onDirtyChange={onDirtyChange}
            onSave={(draft) => edit((m) => { m.props[draft.id] = { ...draft }; })}
            onDelete={() => {
              if (isPropReferenced(model, item.id)) return;
              if (!window.confirm("このプロップを削除しますか？")) return;
              edit((draft) => { delete draft.props[item.id]; });
            }}
          >
            {({ draft, patch }) => (
              <div className="space-y-2 text-xs font-jp">
                <PropPartsPreview prop={draft} themeKey={themeKey} />
                <TextField label="label" value={draft.label} onChange={(label) => patch({ label })} />
                <SelectField label="side" value={draft.side || "right"} onChange={(side) => patch({ side })} options={PROP_SIDE_OPTIONS} />
                <ColorField label="background-color" value={draft.bg} onChange={(bg) => patch({ bg })} />
                <ColorField label="border-color" value={draft.borderColor} onChange={(borderColor) => patch({ borderColor })} />
                <ColorField label="text-color" value={draft.textColor} onChange={(textColor) => patch({ textColor })} />
                <TextField label="title / hint" value={draft.title} onChange={(title) => patch({ title })} />
                <NumberField label="max-chars" value={draft.maxChars} onChange={(maxChars) => patch({ maxChars })} />
              </div>
            )}
          </DraftTemplateForm>
        )
      }
    />
  );
}
