export function getDocumentTitleFromSrc(src, fallbackName = "Document") {
  const match = src.match(/\/title\/([\s\S]*?)(?:\n\/[a-z]+\/|$)/i);
  if (!match) return fallbackName;

  const firstLine = match[1]
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return firstLine || fallbackName;
}

export function documentNameFromFile(file) {
  const base = file.name.replace(/\.txt$/i, "").trim();
  return base || undefined;
}
