export function extractTitleFromSource(src) {
  const match = src.match(/\/title\/([\s\S]*?)(?:\n\/[a-z]+\/|$)/i);
  if (!match) return "";

  const firstLine = match[1]
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine || "";
}
