/** `key: value;` in /role/, /block/, /prop/ — trailing semicolon is required. */
function parseSectionPropertyLine(text) {
  const m = text.match(/^([a-zA-Z\-]+)\s*:\s*(.+);$/);
  if (m) return { key: m[1].toLowerCase(), val: m[2].trim() };
  if (/^[a-zA-Z\-]+\s*:\s*.+/.test(text)) return { missingSemicolon: true };
  return null;
}

const PAGE_PROPERTY_MAP = {
  description: "description",
  "header-left": "headerLeft",
  "header-center": "headerCenter",
  "header-right": "headerRight",
  "footer-left": "footerLeft",
  "footer-center": "footerCenter",
  "footer-right": "footerRight",
};

function emptyPage() {
  return {
    description: "",
    headerLeft: "",
    headerCenter: "",
    headerRight: "",
    footerLeft: "",
    footerCenter: "",
    footerRight: "",
  };
}

/**
 * Read `key: ``` … ```;` from section lines. Single-line `key: value;` when no fence.
 * @returns {{ value?: string, error?: object, nextIndex: number } | null}
 */
function parseKeyedProperty(items, startIndex, key) {
  const { text, line } = items[startIndex];
  const t = text.trim();
  const keyRe = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`^${keyRe}:\\s*\`\`\`\\s*$`, "i").test(t)) {
    const parts = [];
    let j = startIndex + 1;
    while (j < items.length) {
      const close = items[j].text.trim();
      if (/^```;?\s*$/.test(close)) {
        return { value: parts.join("\n").trim(), nextIndex: j + 1 };
      }
      parts.push(items[j].text);
      j++;
    }
    return {
      error: { line, text, msg: `${key}: missing closing \`\`\`` },
      nextIndex: startIndex + 1,
    };
  }
  const single = t.match(new RegExp(`^${keyRe}:\\s*(.+);\\s*$`, "i"));
  if (single) return { value: single[1].trim(), nextIndex: startIndex + 1 };
  if (new RegExp(`^${keyRe}:\\s*`, "i").test(t)) {
    return {
      error: {
        line,
        text,
        msg: `${key}: line must end with ';' or use multiline \`\`\``,
      },
      nextIndex: startIndex + 1,
    };
  }
  return null;
}

function parsePageSection(items, errors) {
  const page = emptyPage();
  for (let i = 0; i < items.length; i++) {
    const { text, line } = items[i];
    const t = text.trim();
    if (!t) continue;
    let matched = false;
    for (const [dslKey, field] of Object.entries(PAGE_PROPERTY_MAP)) {
      const parsed = parseKeyedProperty(items, i, dslKey);
      if (!parsed) continue;
      matched = true;
      if (parsed.error) errors.push(parsed.error);
      else page[field] = parsed.value || "";
      i = parsed.nextIndex - 1;
      break;
    }
    if (!matched) {
      errors.push({ line, text, msg: "unrecognized /page/ line" });
    }
  }
  return page;
}

/** Unescape so `&lt;block01&gt;` and similar are parsed like `<block01>`. */
export function unescapeDslLine(line) {
  return line
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

/** 出現順の表示番号。skipIndex の行は件数に含めず番号なし。 */
export function buildStepRowDisplayInfo(rows) {
  const out = new Map();
  let index = 1;
  rows.forEach((r, i) => {
    if (r.kind !== "step" || r.empty || !r.role) return;
    if (r.skipIndex) {
      out.set(i, { skipped: true });
      return;
    }
    out.set(i, { displayIndex: index++ });
  });
  return out;
}

export function parseDSL(src) {
  const allLines = src.split(/\r?\n/);
  const errors = [];

  let startIdx = -1;
  let endIdx = allLines.length;
  for (let i = 0; i < allLines.length; i++) {
    const t = allLines[i].trim();
    if (t === "@kai-swimlane") { startIdx = i; continue; }
    if (t === "@end" && startIdx >= 0) { endIdx = i; break; }
  }
  if (startIdx < 0) {
    return {
      title: "",
      page: emptyPage(),
      lanes: [],
      rows: [],
      blocks: {},
      props: {},
      errors: [{ line: 1, text: "", msg: "@kai-swimlane marker not found" }],
    };
  }

  const lines = allLines.slice(startIdx + 1, endIdx);
  const sections = { page: [], title: [], role: [], block: [], prop: [], line: [] };
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t) continue;
    if (t.startsWith("***") || t.startsWith("@")) continue;
    const sec = t.match(/^\/(page|title|role|option|block|prop|line)\/$/);
    if (sec) {
      current = sec[1] === "option" ? "role" : sec[1];
      continue;
    }
    const lineNum = startIdx + 1 + i + 1;
    if (current) sections[current].push({ text: raw, line: lineNum });
  }

  const page = parsePageSection(sections.page, errors);

  const title = sections.title
    .map((l) => l.text.trim())
    .filter(Boolean)
    .join(" ");

  const roles = {};
  {
    let active = null;
    for (const { text, line } of sections.role) {
      const t = text.trim();
      if (!t) continue;
      const m = t.match(/^<([^>]+)>$/);
      if (m) {
        active = m[1].trim();
        if (!roles[active]) roles[active] = { id: active };
        continue;
      }
      const kv = parseSectionPropertyLine(t);
      if (kv?.missingSemicolon) {
        errors.push({ line, text, msg: "property line must end with ';'" });
        continue;
      }
      if (kv && active) {
        const map = {
          label: "label",
          "text-color": "textColor",
          "background-color": "bg",
          icon: "icon",
        };
        if (map[kv.key]) roles[active][map[kv.key]] = kv.val;
      }
    }
  }

  const blocks = {};
  {
    let active = null;
    for (const { text, line } of sections.block) {
      const t = text.trim();
      if (!t) continue;
      const m = t.match(/^<([^>]+)>$/);
      if (m) {
        active = m[1].trim();
        if (!blocks[active]) blocks[active] = { id: active };
        continue;
      }
      const kv = parseSectionPropertyLine(t);
      if (kv?.missingSemicolon) {
        errors.push({ line, text, msg: "property line must end with ';'" });
        continue;
      }
      if (kv && active) {
        const map = {
          "background-color": "bg",
          "text-color": "textColor",
          "border-color": "borderColor",
          shape: "shape",
          icon: "icon",
          label: "label",
        };
        if (map[kv.key]) blocks[active][map[kv.key]] = kv.val;
      }
    }
  }

  const props = {};
  {
    let active = null;
    for (const { text, line } of sections.prop) {
      const t = text.trim();
      if (!t) continue;
      const m = t.match(/^<([^>]+)>$/);
      if (m) {
        active = m[1].trim();
        if (!props[active])
          props[active] = { id: active, label: active, side: "right" };
        continue;
      }
      const kv = parseSectionPropertyLine(t);
      if (kv?.missingSemicolon) {
        errors.push({ line, text, msg: "property line must end with ';'" });
        continue;
      }
      if (kv && active) {
        const propMap = {
          label: "label",
          side: "side",
          "background-color": "bg",
          "border-color": "borderColor",
          "text-color": "textColor",
          title: "title",
          hint: "title",
          "max-chars": "maxChars",
        };
        const field = propMap[kv.key];
        if (field === "label") props[active].label = kv.val;
        else if (field === "side") {
          const side = kv.val.toLowerCase();
          props[active].side = side === "left" ? "left" : "right";
        } else if (field === "maxChars") {
          const n = parseInt(kv.val, 10);
          if (!Number.isNaN(n) && n > 0) props[active].maxChars = n;
        } else if (field) props[active][field] = kv.val;
      }
    }
  }

  /**
   * `/line/` parses into a flat list of `rows`, each tagged with a `kind`:
   *   - step                          a task in a lane (`[role: text]`)
   *   - branchStart / branchCase / branchEnd
   *                                   an `if`/`fork` block; `parallel: true`
   *                                   marks the `fork`/`and`/`endfork` variant
   *   - branchLoop                    `[loop]` back-edge to the enclosing `if`
   *   - branchMerge                   `merge <id>;` jump to a step with matching `id:`
   * `stack` tracks open branch frames so nested blocks get the right depth and
   * so each closer (`endif`/`endfork`) matches the frame type it closes.
   */
  const rows = [];
  const stack = [];
  /** if/fork markers share one level; case/path body is one indent (2 spaces) deeper. */
  function branchMarkerDepth() {
    if (stack.length === 0) return 0;
    return stack[stack.length - 1].depth + 1;
  }
  function branchControlDepth() {
    if (stack.length === 0) return 0;
    return stack[stack.length - 1].depth;
  }
  function branchBodyDepth() {
    if (stack.length === 0) return 0;
    return stack[stack.length - 1].depth + 1;
  }
  let branchCounter = 0;
  let lastRealStepIndex = -1;
  let autoIdCounter = 0;
  /** @type {Map<string, { line: number, text: string }>} */
  const mergeIdsSeen = new Map();

  for (let lineIdx = 0; lineIdx < sections.line.length; lineIdx++) {
    const { text, line } = sections.line[lineIdx];
    if (!text.trim()) continue;
    const u = unescapeDslLine(text.trim());
    if (!u) continue;

    let m = u.match(/^if\s*\((.+?)\)\s*is\s*\((.+?)\)\s*than(?:\s+#([A-Za-z]+))?$/i);
    if (m) {
      branchCounter++;
      const id = branchCounter;
      const depth = branchMarkerDepth();
      stack.push({ id, depth, type: "if" });
      rows.push({
        kind: "branchStart",
        cond: m[1].trim(),
        firstCase: m[2].trim(),
        branchColor: m[3] ? m[3].trim().toLowerCase() : null,
        id,
        depth,
      });
      continue;
    }
    m = u.match(/^elseif\s*\((.+?)\)\s*than(?:\s+#([A-Za-z]+))?$/i);
    if (m) {
      const top = stack[stack.length - 1];
      if (!top || top.type !== "if") {
        errors.push({ line, text, msg: "elseif without if" });
        continue;
      }
      rows.push({
        kind: "branchCase",
        label: m[1].trim(),
        branchColor: m[2] ? m[2].trim().toLowerCase() : null,
        id: top.id,
        depth: branchControlDepth(),
      });
      continue;
    }
    if (/^else$/i.test(u)) {
      const top = stack[stack.length - 1];
      if (!top || top.type !== "if") {
        errors.push({ line, text, msg: "else without if" });
        continue;
      }
      rows.push({
        kind: "branchCase",
        label: "else",
        id: top.id,
        depth: branchControlDepth(),
      });
      continue;
    }
    if (/^endif$/i.test(u)) {
      const top = stack[stack.length - 1];
      if (!top || top.type !== "if") {
        errors.push({ line, text, msg: "endif without if" });
        continue;
      }
      stack.pop();
      rows.push({ kind: "branchEnd", id: top.id, depth: top.depth });
      continue;
    }

    /** Parallel split: `fork` opens, `and` adds a concurrent path, `endfork` joins. */
    m = u.match(/^fork(?:\s+#([A-Za-z]+))?$/i);
    if (m) {
      branchCounter++;
      const id = branchCounter;
      const depth = branchMarkerDepth();
      stack.push({ id, depth, type: "fork" });
      rows.push({
        kind: "branchStart",
        parallel: true,
        cond: null,
        firstCase: null,
        branchColor: m[1] ? m[1].trim().toLowerCase() : null,
        id,
        depth,
      });
      continue;
    }
    m = u.match(/^and(?:\s+#([A-Za-z]+))?$/i);
    if (m) {
      const top = stack[stack.length - 1];
      if (!top || top.type !== "fork") {
        errors.push({ line, text, msg: "and without fork" });
        continue;
      }
      rows.push({
        kind: "branchCase",
        parallel: true,
        label: "",
        branchColor: m[1] ? m[1].trim().toLowerCase() : null,
        id: top.id,
        depth: branchControlDepth(),
      });
      continue;
    }
    if (/^endfork$/i.test(u)) {
      const top = stack[stack.length - 1];
      if (!top || top.type !== "fork") {
        errors.push({ line, text, msg: "endfork without fork" });
        continue;
      }
      stack.pop();
      rows.push({ kind: "branchEnd", parallel: true, id: top.id, depth: top.depth });
      continue;
    }

    if (/^:\s*;?$/.test(u)) {
      rows.push({
        kind: "step",
        role: null,
        text: "",
        depth: branchBodyDepth(),
        empty: true,
        stepId: null,
      });
      continue;
    }

    if (/^id:\s*/i.test(u)) {
      m = u.match(/^id:\s*(.+);\s*$/i);
      if (!m) {
        errors.push({ line, text, msg: "id: line must end with ';'" });
        continue;
      }
      if (lastRealStepIndex < 0) {
        errors.push({ line, text, msg: "id: has no preceding step" });
        continue;
      }
      const idVal = m[1].trim();
      if (!idVal) {
        errors.push({ line, text, msg: "id: value must not be empty" });
        continue;
      }
      const prevId = mergeIdsSeen.get(idVal);
      if (prevId) {
        errors.push({
          line: prevId.line,
          text: prevId.text,
          msg: `duplicate step id "${idVal}"`,
        });
        errors.push({ line, text, msg: `duplicate step id "${idVal}"` });
      } else {
        mergeIdsSeen.set(idVal, { line, text });
      }
      rows[lastRealStepIndex].mergeId = idVal;
      continue;
    }
    if (/^label:\s*/i.test(u)) {
      m = u.match(/^label:\s*(.+);\s*$/i);
      if (!m) {
        errors.push({ line, text, msg: "label: line must end with ';'" });
        continue;
      }
      if (lastRealStepIndex < 0) {
        errors.push({ line, text, msg: "label: has no preceding step" });
        continue;
      }
      rows[lastRealStepIndex].name = m[1].trim();
      continue;
    }
    if (/^desc:\s*/i.test(u)) {
      if (lastRealStepIndex < 0) {
        errors.push({ line, text, msg: "desc: has no preceding step" });
        continue;
      }
      const fenced = parseKeyedProperty(sections.line, lineIdx, "desc");
      if (fenced) {
        if (fenced.error) errors.push(fenced.error);
        else rows[lastRealStepIndex].description = fenced.value || "";
        lineIdx = fenced.nextIndex - 1;
        continue;
      }
      continue;
    }
    if (/^skip/i.test(u)) {
      if (!/^skip;\s*$/i.test(u)) {
        errors.push({ line, text, msg: "skip must be written as skip;" });
        continue;
      }
      if (lastRealStepIndex < 0) {
        errors.push({ line, text, msg: "skip has no preceding step" });
        continue;
      }
      rows[lastRealStepIndex].skipIndex = true;
      continue;
    }
    if (/^props:\s*/i.test(u)) {
      m = u.match(/^props:\s*(.+);\s*$/i);
      if (!m) {
        errors.push({ line, text, msg: "props: line must end with ';'" });
        continue;
      }
      if (lastRealStepIndex < 0) {
        errors.push({ line, text, msg: "props: has no preceding step" });
        continue;
      }
      const ids = m[1]
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      rows[lastRealStepIndex].props = ids;
      ids.forEach((id) => {
        if (!props[id]) props[id] = { id, label: id, side: "right" };
      });
      continue;
    }

    if (/^\[loop\]\s*;?\s*$/i.test(u)) {
      const top = stack[stack.length - 1];
      if (!top || top.type !== "if") {
        errors.push({ line, text, msg: "[loop] outside if" });
        continue;
      }
      rows.push({
        kind: "branchLoop",
        loopBranchId: top.id,
        depth: branchBodyDepth(),
      });
      continue;
    }

    /** `merge <id>;` — route this case to a downstream step with matching `id:`. */
    m = u.match(/^merge\s+(.+);\s*$/i);
    if (m) {
      const top = stack[stack.length - 1];
      if (!top || top.type !== "if") {
        errors.push({ line, text, msg: "merge outside if" });
        continue;
      }
      rows.push({
        kind: "branchMerge",
        mergeTarget: m[1].trim(),
        mergeBranchId: top.id,
        depth: branchBodyDepth(),
        line,
        text,
      });
      continue;
    }

    let blockRef = null;
    let work = u;
    const blockAtEnd = u.match(/<([A-Za-z0-9_\-]+)>\s*;?\s*$/);
    if (blockAtEnd) {
      blockRef = blockAtEnd[1];
      work = u.slice(0, blockAtEnd.index).trim();
    }

    m = work.match(
      /^\[([A-Za-z0-9_\-]+)\s*:\s*([\s\S]+?)\]\s*;?\s*$/,
    );
    if (m) {
      const role = m[1].trim();
      const txt = m[2].trim();
      if (!roles[role]) roles[role] = { id: role };
      const stepId = blockRef || `step-${++autoIdCounter}`;
      rows.push({
        kind: "step",
        role,
        text: txt,
        depth: branchBodyDepth(),
        blockRef: blockRef || null,
        stepId,
      });
      lastRealStepIndex = rows.length - 1;
      continue;
    }

    if (/^[A-Za-z0-9_\-]+\s*:\s*\S/.test(work)) {
      errors.push({
        line,
        text,
        msg: "step lines must use [roleId: text] (optional <block> at end of line)",
      });
      continue;
    }

    errors.push({ line, text, msg: "unrecognized line" });
  }

  /** Resolve each `merge <id>;` to the step whose `id:` matches; error if none. */
  for (const r of rows) {
    if (r.kind !== "branchMerge") continue;
    if (!mergeIdsSeen.has(r.mergeTarget)) {
      errors.push({
        line: r.line,
        text: r.text,
        msg: `merge: no step with id "${r.mergeTarget}"`,
      });
    }
    delete r.line;
    delete r.text;
  }

  const seen = new Set();
  const ordered = [];
  for (const { text: roleLine } of sections.role) {
    const m2 = roleLine.trim().match(/^<([^>]+)>$/);
    if (m2 && !seen.has(m2[1])) {
      seen.add(m2[1]);
      ordered.push(m2[1]);
    }
  }
  for (const r of rows) {
    if (r.kind === "step" && r.role && !seen.has(r.role)) {
      seen.add(r.role);
      ordered.push(r.role);
    }
  }
  const lanes = ordered.map((id) => ({
    id,
    label: (roles[id] && roles[id].label) || id,
    textColor: (roles[id] && roles[id].textColor) || null,
    bg: (roles[id] && roles[id].bg) || null,
    icon: (roles[id] && roles[id].icon) || null,
  }));

  return { title, page, lanes, rows, blocks, props, errors };
}

/** Parse /block/ and /prop/ fragments (wraps for parseDSL; not for clipboard). */
export function parseDSLParts(src) {
  const body = src.trim();
  const wrapped = `@kai-swimlane\n/title/\n\n${body}\n/role/\n<__parts_preview__>\nlabel: ;\n/line/\n@end\n`;
  const model = parseDSL(wrapped);
  return {
    blocks: model.blocks,
    props: model.props,
    errors: model.errors,
  };
}