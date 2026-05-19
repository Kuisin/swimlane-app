import { GuiSideModal } from "./gui-side-modal";
import { TemplateListPanel } from "./template-list-panel";
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

export function RolesModal({
  open,
  onClose,
  templateMd,
  model,
  themeKey,
  src,
  onUpdateSrc,
  onReplaceDocument,
}) {
  const defaults = getDefaultTemplates(templateMd);
  const inDoc = getInDocTemplates(model);

  function patchLane(laneId, patch) {
    onUpdateSrc(
      applyModelEdit(src, (draft) => {
        const idx = draft.lanes.findIndex((l) => l.id === laneId);
        if (idx >= 0) draft.lanes[idx] = { ...draft.lanes[idx], ...patch };
      })
    );
  }

  function deleteLane(laneId) {
    if (isLaneReferenced(model, laneId)) return;
    onUpdateSrc(
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
    onUpdateSrc(
      applyModelEdit(src, (draft) => mergeRole(draft, item))
    );
  }

  function addLane() {
    const id = `role_${Date.now()}`;
    onUpdateSrc(
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

  return (
    <GuiSideModal title="役割" open={open} onClose={onClose}>
      <TemplateListPanel
        defaultItems={[...defaults.roles, ...defaults.sets.map((s) => ({ ...s, isSet: true }))]}
        docItems={inDoc.roles}
        onAddDoc={addLane}
        addDocLabel="役割を追加"
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
                item.isSet
                  ? onReplaceDocument?.(item.code)
                  : insertDefault(item)
              }
              isSet={item.isSet}
            />
          ) : (
            <DocRoleForm
              lane={item}
              referenced={isLaneReferenced(model, item.id)}
              onPatch={(patch) => patchLane(item.id, patch)}
              onDelete={() => deleteLane(item.id)}
            />
          )
        }
      />
    </GuiSideModal>
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

function DocRoleForm({ lane, referenced, onPatch, onDelete }) {
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
      <button
        type="button"
        disabled={referenced}
        onClick={onDelete}
        className="text-xs text-red-700 border border-red-300 px-2 py-1 rounded disabled:opacity-40"
      >
        削除
      </button>
      {referenced && (
        <p className="text-[10px] text-stone-500">ステップで使用中のため削除不可</p>
      )}
    </div>
  );
}

