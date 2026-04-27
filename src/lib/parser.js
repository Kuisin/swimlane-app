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
      lanes: [],
      rows: [],
      blocks: {},
      props: {},
      errors: [{ line: 1, text: "", msg: "@kai-swimlane marker not found" }],
    };
  }

  const lines = allLines.slice(startIdx + 1, endIdx);
  const sections = { title: [], role: [], block: [], prop: [], line: [] };
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t) continue;
    if (t.startsWith("***") || t.startsWith("@")) continue;
    const sec = t.match(/^\/(title|role|option|block|prop|line)\/$/);
    if (sec) {
      current = sec[1] === "option" ? "role" : sec[1];
      continue;
    }
    const lineNum = startIdx + 1 + i + 1;
    if (current) sections[current].push({ text: raw, line: lineNum });
  }

  const title = sections.title
    .map((l) => l.text.trim())
    .filter(Boolean)
    .join(" ");

  const roles = {};
  {
    let active = null;
    for (const { text } of sections.role) {
      const t = text.trim();
      if (!t) continue;
      const m = t.match(/^<([^>]+)>$/);
      if (m) {
        active = m[1].trim();
        if (!roles[active]) roles[active] = { id: active };
        continue;
      }
      const kv = t.match(/^([a-zA-Z\-]+)\s*:\s*(.+?);?$/);
      if (kv && active) {
        const key = kv[1].toLowerCase();
        const val = kv[2].trim().replace(/;$/, "");
        const map = {
          label: "label",
          "text-color": "textColor",
          "background-color": "bg",
          icon: "icon",
        };
        if (map[key]) roles[active][map[key]] = val;
      }
    }
  }

  const blocks = {};
  {
    let active = null;
    for (const { text } of sections.block) {
      const t = text.trim();
      if (!t) continue;
      const m = t.match(/^<([^>]+)>$/);
      if (m) {
        active = m[1].trim();
        if (!blocks[active]) blocks[active] = { id: active };
        continue;
      }
      const kv = t.match(/^([a-zA-Z\-]+)\s*:\s*(.+?);?$/);
      if (kv && active) {
        const key = kv[1].toLowerCase();
        const val = kv[2].trim().replace(/;$/, "");
        const map = {
          "background-color": "bg",
          "text-color": "textColor",
          "border-color": "borderColor",
          shape: "shape",
          icon: "icon",
          label: "label",
        };
        if (map[key]) blocks[active][map[key]] = val;
      }
    }
  }

  const props = {};
  {
    let active = null;
    for (const { text } of sections.prop) {
      const t = text.trim();
      if (!t) continue;
      const m = t.match(/^<([^>]+)>$/);
      if (m) {
        active = m[1].trim();
        if (!props[active])
          props[active] = { id: active, label: active, side: "right" };
        continue;
      }
      const kv = t.match(/^([a-zA-Z\-]+)\s*:\s*(.+?);?$/);
      if (kv && active) {
        const key = kv[1].toLowerCase();
        const val = kv[2].trim().replace(/;$/, "");
        if (key === "label") props[active].label = val;
        if (key === "side") {
          const side = val.toLowerCase();
          props[active].side = side === "left" ? "left" : "right";
        }
      }
    }
  }

  const rows = [];
  const stack = [];
  let branchCounter = 0;
  let lastRealStepIndex = -1;
  let autoIdCounter = 0;

  for (const { text, line } of sections.line) {
    if (!text.trim()) continue;
    const u = unescapeDslLine(text.trim());
    if (!u) continue;

    let m = u.match(/^if\s*\((.+?)\)\s*than\s*\((.+?)\)$/i);
    if (m) {
      branchCounter++;
      const id = branchCounter;
      stack.push({ id, depth: stack.length });
      rows.push({
        kind: "branchStart",
        cond: m[1].trim(),
        firstCase: m[2].trim(),
        id,
        depth: stack.length - 1,
      });
      continue;
    }
    m = u.match(/^elseif\s*\((.+?)\)$/i);
    if (m) {
      const top = stack[stack.length - 1];
      if (!top) {
        errors.push({ line, text, msg: "elseif without if" });
        continue;
      }
      rows.push({
        kind: "branchCase",
        label: m[1].trim(),
        id: top.id,
        depth: top.depth,
      });
      continue;
    }
    if (/^else$/i.test(u)) {
      const top = stack[stack.length - 1];
      if (!top) {
        errors.push({ line, text, msg: "else without if" });
        continue;
      }
      rows.push({
        kind: "branchCase",
        label: "else",
        id: top.id,
        depth: top.depth,
      });
      continue;
    }
    if (/^endif$/i.test(u)) {
      const top = stack.pop();
      if (!top) {
        errors.push({ line, text, msg: "endif without if" });
        continue;
      }
      rows.push({ kind: "branchEnd", id: top.id, depth: top.depth });
      continue;
    }

    if (/^:\s*;?$/.test(u)) {
      rows.push({
        kind: "step",
        role: null,
        text: "",
        depth: stack.length,
        empty: true,
        stepId: null,
      });
      continue;
    }

    m = u.match(/^label:\s*(.+?);?\s*$/);
    if (m) {
      if (lastRealStepIndex < 0) {
        errors.push({ line, text, msg: "label: has no preceding step" });
        continue;
      }
      const pr = rows[lastRealStepIndex];
      pr.name = m[1].trim().replace(/;$/, "");
      continue;
    }
    m = u.match(/^desc:\s*(.+?);?\s*$/);
    if (m) {
      if (lastRealStepIndex < 0) {
        errors.push({ line, text, msg: "desc: has no preceding step" });
        continue;
      }
      const pr = rows[lastRealStepIndex];
      pr.description = m[1].trim().replace(/;$/, "");
      continue;
    }
    if (/^skip;?\s*$/i.test(u)) {
      if (lastRealStepIndex < 0) {
        errors.push({ line, text, msg: "skip has no preceding step" });
        continue;
      }
      rows[lastRealStepIndex].skipIndex = true;
      continue;
    }
    m = u.match(/^props:\s*(.+?);?\s*$/i);
    if (m) {
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
        depth: stack.length,
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

  return { title, lanes, rows, blocks, props, errors };
}