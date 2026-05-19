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

function firstBranchCaseLabel(rows, startIndex) {
  const start = rows[startIndex];
  const embedded = (start.firstCase || "").trim();
  if (embedded) return embedded;
  for (let i = startIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind === "branchEnd" && row.id === start.id) break;
    if (row.kind === "branchStart") break;
    if (row.kind === "branchCase" && row.id === start.id) {
      const label = (row.label || "").trim();
      if (label && !/^else$/i.test(label)) return label;
    }
  }
  return "";
}

/** First branchCase after branchStart is serialized inside the if line. */
function isFirstBranchCaseRow(rows, caseIndex) {
  const row = rows[caseIndex];
  if (row.kind !== "branchCase") return false;
  let startIdx = -1;
  for (let i = caseIndex - 1; i >= 0; i--) {
    if (rows[i].kind === "branchStart" && rows[i].id === row.id) {
      startIdx = i;
      break;
    }
    if (rows[i].kind === "branchEnd" && rows[i].id === row.id) return false;
  }
  if (startIdx < 0) return false;
  if ((rows[startIdx].firstCase || "").trim()) return false;
  for (let i = startIdx + 1; i < caseIndex; i++) {
    if (rows[i].kind === "branchCase" && rows[i].id === row.id) return false;
  }
  return true;
}

function serializeLineRows(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind === "branchStart") {
      const color = serializeBranchColor(row.branchColor);
      const firstCase = firstBranchCaseLabel(rows, i);
      out.push(`if (${row.cond}) is (${firstCase}) than${color}`);
      continue;
    }
    if (row.kind === "branchCase") {
      if (isFirstBranchCaseRow(rows, i)) continue;
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
