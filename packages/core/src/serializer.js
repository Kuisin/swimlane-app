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

const INDENT = "  ";

function indent(depth, line) {
  return INDENT.repeat(Math.max(0, depth ?? 0)) + line;
}

function pushBlankLine(out) {
  if (out.length > 0 && out[out.length - 1] !== "") {
    out.push("");
  }
}

function serializeStepLines(out, row, depth) {
  if (row.empty) {
    out.push(indent(depth, ":"));
    return;
  }
  const blockSuffix = row.blockRef ? ` <${row.blockRef}>` : "";
  out.push(indent(depth, `[${row.role}: ${row.text}]${blockSuffix}`));
  if (row.name) out.push(indent(depth, `label: ${row.name};`));
  if (row.description) out.push(indent(depth, `desc: ${row.description};`));
  if (row.skipIndex) out.push(indent(depth, "skip;"));
  if (row.props?.length) {
    out.push(indent(depth, `props: ${row.props.join(",")};`));
  }
}

function serializeLineRows(rows) {
  const out = [];
  let prevKind = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const depth = row.depth ?? 0;

    if (row.kind === "branchStart") {
      if (
        prevKind === "branchEnd" ||
        (prevKind === "step" && depth === 0)
      ) {
        pushBlankLine(out);
      }
      const color = serializeBranchColor(row.branchColor);
      const firstCase = firstBranchCaseLabel(rows, i);
      out.push(indent(depth, `if (${row.cond}) is (${firstCase}) than${color}`));
      prevKind = "branchStart";
      continue;
    }

    if (row.kind === "branchCase") {
      if (isFirstBranchCaseRow(rows, i)) {
        prevKind = "branchCase";
        continue;
      }
      pushBlankLine(out);
      const label = (row.label || "").trim();
      if (/^else$/i.test(label)) {
        out.push(indent(depth, "else"));
      } else {
        const color = serializeBranchColor(row.branchColor);
        out.push(indent(depth, `elseif (${label}) than${color}`));
      }
      prevKind = "branchCase";
      continue;
    }

    if (row.kind === "branchEnd") {
      out.push(indent(depth, "endif"));
      prevKind = "branchEnd";
      const next = rows[i + 1];
      if (
        next &&
        (next.kind === "branchStart" ||
          (next.kind === "step" && !next.empty && (next.depth ?? 0) <= depth))
      ) {
        pushBlankLine(out);
      }
      continue;
    }

    if (row.kind === "branchLoop") {
      out.push(indent(depth, "[loop]"));
      prevKind = "branchLoop";
      continue;
    }

    if (row.kind === "step") {
      if (depth === 0 && prevKind === "step" && !row.empty) {
        pushBlankLine(out);
      }
      serializeStepLines(out, row, depth);
      prevKind = "step";
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
