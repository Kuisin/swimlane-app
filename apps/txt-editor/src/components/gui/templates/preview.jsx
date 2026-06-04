import { useMemo } from "react";
import { KaiSwimlanePartsPreview } from "kai-swimlane-parts";
import { KaiSwimlanePreview } from "kai-swimlane";
import { LucideIconMark } from "../parts-form-fields";
import {
  blockToPartsCode,
  laneFromRoleCode,
  propToPartsCode,
} from "../../../lib/template-catalog";

const PARTS_PREVIEW_CLASS =
  "rounded-md border border-stone-300 overflow-auto max-h-48 mb-3";

export function RoleLanePreview({ lane }) {
  if (!lane) return null;
  const bg = lane.bg || "#f5f5f4";
  const color = lane.textColor || "#1e293b";

  return (
    <div className="rounded-md border border-stone-300 overflow-hidden mb-3 bg-white">
      <div
        className="px-4 py-2.5 font-jp text-sm font-medium flex items-center gap-2"
        style={{ background: bg, color }}
      >
        <LucideIconMark icon={lane.icon} size={18} className="shrink-0" />
        <span className="truncate">{lane.label || lane.id}</span>
      </div>
      <p className="px-3 py-1.5 font-mono text-[10px] text-stone-500 border-t border-stone-200">
        {lane.id}
      </p>
    </div>
  );
}

export function RoleCodePreview({ code }) {
  const lane = useMemo(() => laneFromRoleCode(code), [code]);
  return <RoleLanePreview lane={lane} />;
}

function PartsPreview({ entity, code, toCode, themeKey, className = PARTS_PREVIEW_CLASS }) {
  const partsCode = code || (entity ? toCode(entity) : "");
  if (!partsCode.trim()) return null;
  return (
    <KaiSwimlanePartsPreview
      code={partsCode}
      themeKey={themeKey}
      className={className}
    />
  );
}

export function BlockPartsPreview({ block, code, themeKey, className }) {
  return (
    <PartsPreview
      code={code}
      entity={block}
      toCode={blockToPartsCode}
      themeKey={themeKey}
      className={className}
    />
  );
}

export function PropPartsPreview({ prop, code, themeKey, className }) {
  return (
    <PartsPreview
      code={code}
      entity={prop}
      toCode={propToPartsCode}
      themeKey={themeKey}
      className={className}
    />
  );
}

export function SetDiagramPreview({ code, themeKey }) {
  if (!code?.trim()) return null;
  return (
    <KaiSwimlanePreview
      code={code}
      themeKey={themeKey}
      className="rounded-md border border-stone-300 overflow-auto max-h-56 mb-3"
    />
  );
}
