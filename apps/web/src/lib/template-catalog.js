import { parseDSL, parseDSLParts, parseTemplateMd } from "@kai-swimlane/core";

export function getDefaultTemplates(templateMd) {
  const categories = parseTemplateMd(templateMd);
  const itemsFor = (id) => categories.find((cat) => cat.id === id)?.items ?? [];
  return {
    roles: itemsFor("role"),
    blocks: itemsFor("block"),
    props: itemsFor("prop"),
    sets: itemsFor("set"),
  };
}

export function getInDocTemplates(model) {
  return {
    roles: model.lanes || [],
    blocks: Object.values(model.blocks || {}),
    props: Object.values(model.props || {}),
  };
}

export function mergeBlockProp(model, item) {
  const { blocks, props } = parseDSLParts(item.code);
  const next = structuredClone(model);
  Object.assign(next.blocks, blocks);
  Object.assign(next.props, props);
  return next;
}

export function mergeRole(model, item) {
  const wrapped = `@kai-swimlane\n/role/\n${item.code}\n/line/\n@end\n`;
  const parsed = parseDSL(wrapped);
  const next = structuredClone(model);
  for (const lane of parsed.lanes) {
    const idx = next.lanes.findIndex((l) => l.id === lane.id);
    if (idx >= 0) next.lanes[idx] = { ...next.lanes[idx], ...lane };
    else next.lanes.push(lane);
  }
  return next;
}

export function uniqueId(base, existing) {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

export function isLaneReferenced(model, laneId) {
  return (model.rows || []).some(
    (row) => row.kind === "step" && row.role === laneId
  );
}

export function isBlockReferenced(model, blockId) {
  return (model.rows || []).some(
    (row) => row.kind === "step" && row.blockRef === blockId
  );
}

export function isPropReferenced(model, propId) {
  return (model.rows || []).some(
    (row) => row.kind === "step" && (row.props || []).includes(propId)
  );
}

function emitProp(key, value) {
  if (value == null || value === "") return null;
  return `${key}: ${value};`;
}

export function blockToPartsCode(block) {
  const lines = [`<${block.id}>`];
  const props = [
    emitProp("label", block.label),
    emitProp("background-color", block.bg),
    emitProp("text-color", block.textColor),
    emitProp("border-color", block.borderColor),
    emitProp("shape", block.shape),
    emitProp("icon", block.icon),
  ].filter(Boolean);
  return `/block/\n\n${[...lines, ...props].join("\n")}`;
}

export function propToPartsCode(prop) {
  const lines = [`<${prop.id}>`];
  const props = [
    emitProp("label", prop.label),
    emitProp("side", prop.side),
    emitProp("background-color", prop.bg),
    emitProp("border-color", prop.borderColor),
    emitProp("text-color", prop.textColor),
    emitProp("title", prop.title),
    emitProp(
      "max-chars",
      prop.maxChars != null ? String(prop.maxChars) : null
    ),
  ].filter(Boolean);
  return `/prop/\n\n${[...lines, ...props].join("\n")}`;
}

export function laneFromRoleCode(code) {
  const wrapped = `@kai-swimlane\n/title/\n\n/role/\n${code.trim()}\n/line/\n@end\n`;
  const model = parseDSL(wrapped);
  if (model.errors.length > 0) return null;
  return model.lanes[0] || null;
}
