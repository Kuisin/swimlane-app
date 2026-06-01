function emitProperty(key, value) {
  if (value == null || value === "") return null;
  return `${key}: ${value};`;
}

function emitMultilineProperty(key, value) {
  if (value == null || value === "") return null;
  if (!String(value).includes("\n")) return `${key}: ${value};`;
  return [`${key}: \`\`\``, ...String(value).split("\n"), "```;"];
}

function hasPageContent(page) {
  if (!page) return false;
  return Object.values(page).some((v) => v && String(v).trim());
}

function serializePage(page) {
  const out = [];
  const entries = [
    ["description", page.description],
    ["header-left", page.headerLeft],
    ["header-center", page.headerCenter],
    ["header-right", page.headerRight],
    ["footer-left", page.footerLeft],
    ["footer-center", page.footerCenter],
    ["footer-right", page.footerRight],
  ];
  for (const [key, value] of entries) {
    const lines = emitMultilineProperty(key, value);
    if (!lines) continue;
    if (Array.isArray(lines)) out.push(...lines);
    else out.push(lines);
  }
  return out;
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

/** if / elseif / else / endif share the branchStart depth. */
function branchControlDepth(rows, rowIndex) {
  const row = rows[rowIndex];
  if (row.kind === "branchStart") return row.depth ?? 0;
  if (row.kind === "branchCase" || row.kind === "branchEnd") {
    for (let j = rowIndex; j >= 0; j--) {
      if (rows[j].kind === "branchStart" && rows[j].id === row.id) {
        return rows[j].depth ?? 0;
      }
    }
  }
  return row.depth ?? 0;
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
  if (row.description) {
    const descLines = emitMultilineProperty("desc", row.description);
    if (Array.isArray(descLines)) {
      // Only the `desc: ```` opener and closing ```` are indented to the step.
      // Content lines stay flush-left: the parser reads fence bodies verbatim,
      // so indenting them would fold that whitespace into the description.
      out.push(indent(depth, descLines[0]));
      descLines.slice(1, -1).forEach((l) => out.push(l));
      out.push(indent(depth, descLines[descLines.length - 1]));
    } else {
      out.push(indent(depth, descLines));
    }
  }
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
    const controlDepth = branchControlDepth(rows, i);

    if (row.kind === "branchStart") {
      if (
        prevKind === "branchEnd" ||
        (prevKind === "step" && depth === 0)
      ) {
        pushBlankLine(out);
      }
      const color = serializeBranchColor(row.branchColor);
      if (row.parallel) {
        out.push(indent(controlDepth, `fork${color}`));
      } else {
        const firstCase = firstBranchCaseLabel(rows, i);
        out.push(
          indent(controlDepth, `if (${row.cond}) is (${firstCase}) than${color}`),
        );
      }
      prevKind = "branchStart";
      continue;
    }

    if (row.kind === "branchCase") {
      // A fork has no embedded first case; every `and` row is serialized.
      if (!row.parallel && isFirstBranchCaseRow(rows, i)) {
        prevKind = "branchCase";
        continue;
      }
      pushBlankLine(out);
      const color = serializeBranchColor(row.branchColor);
      if (row.parallel) {
        out.push(indent(controlDepth, `and${color}`));
      } else {
        const label = (row.label || "").trim();
        if (/^else$/i.test(label)) {
          out.push(indent(controlDepth, "else"));
        } else {
          out.push(indent(controlDepth, `elseif (${label}) than${color}`));
        }
      }
      prevKind = "branchCase";
      continue;
    }

    if (row.kind === "branchEnd") {
      out.push(indent(controlDepth, row.parallel ? "endfork" : "endif"));
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

    if (row.kind === "branchMerge") {
      out.push(indent(depth, `merge ${row.mergeTarget};`));
      prevKind = "branchMerge";
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

  if (hasPageContent(model.page)) {
    lines.push("/page/");
    lines.push(...serializePage(model.page));
    lines.push("");
  }

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
