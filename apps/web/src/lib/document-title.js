const TITLE_PATTERN = /\/title\/([\s\S]*?)(?:\n\/[a-z]+\/|$)/i;

export function extractDocumentTitle(src, fallback = "") {
  const match = src.match(TITLE_PATTERN);
  if (!match) return fallback;

  const firstLine = match[1]
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine || fallback;
}

export function documentNameFromFile(file) {
  const base = file.name.replace(/\.txt$/i, "").trim();
  return base || undefined;
}
