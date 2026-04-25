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
      errors: [{ line: 1, text: "", msg: "@kai-swimlane marker not found" }],
    };
  }

  const lines = allLines.slice(startIdx + 1, endIdx);
  const sections = { title: [], role: [], block: [], line: [] };
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const t = raw.trim();
    if (!t) continue;
    if (t.startsWith("***") || t.startsWith("@")) continue;
    const sec = t.match(/^\/(title|role|option|block|line)\/$/);
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

  const rows = [];
  const stack = [];
  let branchCounter = 0;

  for (const { text, line } of sections.line) {
    const t = text.trim();
    if (!t) continue;

    let m = t.match(/^if\s*\((.+?)\)\s*than\s*\((.+?)\)$/i);
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
    m = t.match(/^elseif\s*\((.+?)\)$/i);
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
    if (/^else$/i.test(t)) {
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
    if (/^endif$/i.test(t)) {
      const top = stack.pop();
      if (!top) {
        errors.push({ line, text, msg: "endif without if" });
        continue;
      }
      rows.push({ kind: "branchEnd", id: top.id, depth: top.depth });
      continue;
    }

    if (/^:\s*;?$/.test(t)) {
      rows.push({
        kind: "step",
        role: null,
        text: "",
        depth: stack.length,
        empty: true,
      });
      continue;
    }

    let blockRef = null;
    let body = t;
    const blockMatch = body.match(/<([A-Za-z0-9_\-]+)>\s*;?\s*$/);
    if (blockMatch) {
      blockRef = blockMatch[1];
      body = body.slice(0, blockMatch.index).trim().replace(/;$/, "").trim();
    }

    m = body.match(/^([A-Za-z0-9_\-]+)\s*:\s*(.+?);?\s*$/);
    if (m) {
      const role = m[1].trim();
      const txt = m[2].trim().replace(/;$/, "");
      if (!roles[role]) roles[role] = { id: role };
      rows.push({ kind: "step", role, text: txt, depth: stack.length, blockRef });
      continue;
    }
    errors.push({ line, text, msg: "unrecognized line" });
  }

  const seen = new Set();
  const ordered = [];
  for (const { text } of sections.role) {
    const m = text.trim().match(/^<([^>]+)>$/);
    if (m && !seen.has(m[1])) {
      seen.add(m[1]);
      ordered.push(m[1]);
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

  return { title, lanes, rows, blocks, errors };
}
