import { useMemo } from "react";
import { KaiSwimlanePartsPreview } from "kai-swimlane-parts";
import { KaiSwimlanePreview } from "kai-swimlane";
import {
  blockToPartsCode,
  laneFromRoleCode,
  propToPartsCode,
} from "../../lib/template-catalog";

export function RoleLanePreview({ lane }) {
  if (!lane) return null;
  const bg = lane.bg || "#f5f5f4";
  const color = lane.textColor || "#1e293b";

  return (
    <div className="rounded-md border border-stone-300 overflow-hidden mb-3 bg-white">
      <div
        className="px-4 py-2.5 font-jp text-sm font-medium"
        style={{ background: bg, color }}
      >
        {lane.label || lane.id}
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

const defaultPartsPreviewClass =
  "rounded-md border border-stone-300 overflow-auto max-h-48 mb-3";

export function BlockPartsPreview({
  block,
  code,
  themeKey,
  className = defaultPartsPreviewClass,
}) {
  const partsCode = code || (block ? blockToPartsCode(block) : "");
  if (!partsCode.trim()) return null;
  return (
    <KaiSwimlanePartsPreview
      code={partsCode}
      themeKey={themeKey}
      className={className}
    />
  );
}

export function PropPartsPreview({
  prop,
  code,
  themeKey,
  className = defaultPartsPreviewClass,
}) {
  const partsCode = code || (prop ? propToPartsCode(prop) : "");
  if (!partsCode.trim()) return null;
  return (
    <KaiSwimlanePartsPreview
      code={partsCode}
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
