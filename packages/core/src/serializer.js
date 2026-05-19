function emitProperty(key, value) {
  if (value == null || value === "") return null;
  return `${key}: ${value};`;
}

function serializeRole(lane) {
  const lines = [`<${lane.id}>`];
  const props = [
    emitProperty("label", lane.label),
    emitProperty("text-color", lane.textColor),
    emitProperty("background-color", lane.bg),
    emitProperty("icon", lane.icon),
  ].filter(Boolean);
  return [...lines, ...props];
}

function serializeBlock(block) {
  const lines = [`<${block.id}>`];
  const props = [
    emitProperty("label", block.label),
    emitProperty("background-color", block.bg),
    emitProperty("text-color", block.textColor),
    emitProperty("border-color", block.borderColor),
    emitProperty("shape", block.shape),
    emitProperty("icon", block.icon),
  ].filter(Boolean);
  return [...lines, ...props];
}

function serializeProp(prop) {
  const lines = [`<${prop.id}>`];
  const props = [
    emitProperty("label", prop.label),
    emitProperty("side", prop.side),
    emitProperty("background-color", prop.bg),
    emitProperty("border-color", prop.borderColor),
    emitProperty("text-color", prop.textColor),
    emitProperty("title", prop.title),
    emitProperty("max-chars", prop.maxChars != null ? String(prop.maxChars) : null),
  ].filter(Boolean);
  return [...lines, ...props];
}

function serializeBranchColor(color) {
  return color ? ` #${color}` : "";
}

function serializeLineRows(rows) {
  const out = [];
  for (const row of rows) {
    if (row.kind === "branchStart") {
      const color = serializeBranchColor(row.branchColor);
      out.push(
        `if (${row.cond}) is (${row.firstCase}) than${color}`
      );
      continue;
    }
    if (row.kind === "branchCase") {
      const label = (row.label || "").trim();
      if (/^else$/i.test(label)) {
        out.push("else");
      } else {
        const color = serializeBranchColor(row.branchColor);
        out.push(`elseif (${label}) than${color}`);
      }
      continue;
    }
    if (row.kind === "branchEnd") {
      out.push("endif");
      continue;
    }
    if (row.kind === "branchLoop") {
      out.push("[loop]");
      continue;
    }
    if (row.kind === "step") {
      if (row.empty) {
        out.push(":");
        continue;
      }
      const blockSuffix = row.blockRef ? ` <${row.blockRef}>` : "";
      out.push(`[${row.role}: ${row.text}]${blockSuffix}`);
      if (row.name) out.push(`label: ${row.name};`);
      if (row.description) out.push(`desc: ${row.description};`);
      if (row.skipIndex) out.push("skip;");
      if (row.props?.length) out.push(`props: ${row.props.join(",")};`);
    }
  }
  return out;
}

export function serializeDSL(model) {
  const lines = ["@kai-swimlane", ""];

  lines.push("/title/");
  if (model.title) lines.push(model.title);
  lines.push("");

  lines.push("/role/");
  lines.push("");
  for (const lane of model.lanes || []) {
    lines.push(...serializeRole(lane));
    lines.push("");
  }

  const blockEntries = Object.values(model.blocks || {});
  if (blockEntries.length > 0) {
    lines.push("/block/");
    lines.push("");
    for (const block of blockEntries) {
      lines.push(...serializeBlock(block));
      lines.push("");
    }
  }

  const propEntries = Object.values(model.props || {});
  if (propEntries.length > 0) {
    lines.push("/prop/");
    lines.push("");
    for (const prop of propEntries) {
      lines.push(...serializeProp(prop));
      lines.push("");
    }
  }

  lines.push("/line/");
  lines.push("");
  lines.push(...serializeLineRows(model.rows || []));
  lines.push("");
  lines.push("@end");

  return lines.join("\n");
}
