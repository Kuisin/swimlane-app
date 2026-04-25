export function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function parseHelpMd(md) {
  const sections = [];
  for (const block of md.split(/^## /m).filter(Boolean)) {
    const lines = block.split(/\r?\n/);
    const title = lines[0].trim();
    const body = lines.slice(1).join("\n");
    const codeMatch = body.match(/```\n?([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].replace(/\n$/, "") : "";
    const desc = body.replace(/```[\s\S]*?```/, "").trim();
    sections.push({ title, code, desc });
  }
  return sections;
}
