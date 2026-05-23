import { useEffect } from "react";
import { TemplateListPanel } from "./template-list-panel";
import { DraftTemplateForm } from "./draft-template-form";
import {
  RoleCodePreview,
  RoleLanePreview,
  SetDiagramPreview,
} from "./template-preview";
import {
  getDefaultTemplates,
  getInDocTemplates,
  isLaneReferenced,
  mergeRole,
} from "../../lib/template-catalog";
import { applyModelEdit } from "../../lib/gui-model";
import { useUnsavedGuard } from "../../hooks/use-unsaved-guard";
import { useEditor } from "../../hooks/use-editor";
import {
  ColorField,
  IconSelectField,
  TextField,
} from "./parts-form-fields";

function ColorSwatch({ color }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-sm border border-stone-300 shrink-0"
      style={{ background: color || "#e7e5e4" }}
    />
  );
}

export function RolesTemplatePanel({ registerGuardUnsaved }) {
  const {
    templateMd,
    model,
    themeKey,
    src,
    updateActiveDocumentSrc,
    replaceActiveDocumentSrc,
  } = useEditor();
  const defaults = getDefaultTemplates(templateMd);
  const inDoc = getInDocTemplates(model);
  const { onDirtyChange, guardUnsaved } = useUnsavedGuard();

  useEffect(() => {
    registerGuardUnsaved?.(guardUnsaved);
  }, [guardUnsaved, registerGuardUnsaved]);

  function handleReplaceDocument(code) {
    if (
      !window.confirm(
        "現在のドキュメントをテンプレートで置き換えます。よろしいですか？"
      )
    ) {
      return;
    }
    replaceActiveDocumentSrc(code);
  }

  function saveLane(draft) {
    updateActiveDocumentSrc(
      applyModelEdit(src, (m) => {
        const idx = m.lanes.findIndex((l) => l.id === draft.id);
        if (idx >= 0) m.lanes[idx] = { ...draft };
      })
    );
  }

  function deleteLane(laneId) {
    if (isLaneReferenced(model, laneId)) return;
    if (!window.confirm("この役割を削除しますか？")) return;
    updateActiveDocumentSrc(
      applyModelEdit(src, (draft) => {
        draft.lanes = draft.lanes.filter((l) => l.id !== laneId);
      })
    );
  }

  function insertDefault(item) {
    if (
      model.lanes.some((l) => l.id && item.code?.includes(`<${l.id}>`)) &&
      !window.confirm("同名の役割があります。上書きしますか？")
    ) {
      return;
    }
    updateActiveDocumentSrc(
      applyModelEdit(src, (draft) => mergeRole(draft, item))
    );
  }

  function addLane() {
    const id = `role_${Date.now()}`;
    updateActiveDocumentSrc(
      applyModelEdit(src, (draft) => {
        draft.lanes.push({
          id,
          label: "新しい役割",
          textColor: "#1e293b",
          bg: "#ffffff",
        });
      })
    );
  }

  function reorderLane(lane, direction) {
    updateActiveDocumentSrc(
      applyModelEdit(src, (draft) => {
        const idx = draft.lanes.findIndex((l) => l.id === lane.id);
        if (idx < 0) return;
        const target = direction === "up" ? idx - 1 : idx + 1;
        if (target < 0 || target >= draft.lanes.length) return;
        const next = [...draft.lanes];
        [next[idx], next[target]] = [next[target], next[idx]];
        draft.lanes = next;
      })
    );
  }

  return (
    <TemplateListPanel
      defaultItems={[...defaults.roles, ...defaults.sets.map((s) => ({ ...s, isSet: true }))]}
      docItems={inDoc.roles}
      onAddDoc={addLane}
      addDocLabel="役割を追加"
      guardUnsaved={guardUnsaved}
      onReorderDocItem={reorderLane}
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
          <DefaultRoleDetail
            item={item}
            themeKey={themeKey}
            onInsert={() =>
              item.isSet ? handleReplaceDocument(item.code) : insertDefault(item)
            }
            isSet={item.isSet}
          />
        ) : (
          <DraftTemplateForm
            key={item.id}
            item={item}
            referenced={isLaneReferenced(model, item.id)}
            onDirtyChange={onDirtyChange}
            onSave={saveLane}
            onDelete={() => deleteLane(item.id)}
          >
            {({ draft, patch }) => (
              <DocRoleForm lane={draft} onPatch={patch} />
            )}
          </DraftTemplateForm>
        )
      }
    />
  );
}

function DefaultRoleDetail({ item, themeKey, onInsert, isSet }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold font-jp">{item.title}</h3>
      {item.desc && <p className="text-xs text-stone-600 font-jp">{item.desc}</p>}
      {isSet ? (
        <SetDiagramPreview code={item.code} themeKey={themeKey} />
      ) : (
        <RoleCodePreview code={item.code} />
      )}
      <pre className="text-[10px] font-mono bg-stone-900 text-stone-100 p-3 rounded overflow-auto max-h-48">
        {item.code}
      </pre>
      <button
        type="button"
        onClick={onInsert}
        className="text-xs font-jp px-3 py-1.5 border border-stone-300 rounded hover:bg-stone-100"
      >
        {isSet ? "フルテンプレートで置換" : "挿入"}
      </button>
    </div>
  );
}

function DocRoleForm({ lane, onPatch }) {
  return (
    <div className="space-y-2 text-xs font-jp">
      <RoleLanePreview lane={lane} />
      <TextField label="ID" value={lane.id} readOnly mono onChange={() => {}} />
      <TextField
        label="label"
        value={lane.label}
        onChange={(label) => onPatch({ label })}
      />
      <ColorField
        label="text-color"
        value={lane.textColor}
        onChange={(textColor) => onPatch({ textColor })}
      />
      <ColorField
        label="background-color"
        value={lane.bg}
        onChange={(bg) => onPatch({ bg })}
      />
      <IconSelectField
        label="icon"
        value={lane.icon}
        onChange={(icon) => onPatch({ icon })}
      />
    </div>
  );
}