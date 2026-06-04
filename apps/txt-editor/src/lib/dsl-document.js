import DEFAULT_TAB_TEMPLATE from "@kai-swimlane/content/default-tab-template.txt?raw";
import { parseDSL } from "@kai-swimlane/core";

export { DEFAULT_TAB_TEMPLATE };

/** True when the file has no DSL content (empty or whitespace only). */
export function isBlankTxtContent(content) {
  return !String(content ?? "").trim();
}

/** Normalize line endings before comparing in-memory vs disk text. */
export function normalizeTxtForCompare(content) {
  return String(content ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** Whether the document differs from what is persisted on disk. */
export function isDocumentDirty(doc) {
  if (!doc) return false;
  if (doc.needsInitialDiskSave) return true;
  return (
    normalizeTxtForCompare(doc.src) !== normalizeTxtForCompare(doc.savedSrc)
  );
}

/** True when the file should open with the default DSL template. */
export function shouldInitializeAsDsl(rawContent) {
  if (isBlankTxtContent(rawContent)) return true;
  const { errors } = parseDSL(rawContent);
  return (
    errors.length === 1 &&
    errors[0]?.msg === "@kai-swimlane marker not found"
  );
}

/** Editor has valid DSL while disk is still empty (e.g. stale watcher read after save). */
export function isStaleBlankDiskRead(diskContent, editorSrc) {
  if (!isBlankTxtContent(diskContent)) return false;
  return parseDSL(editorSrc).errors.length === 0;
}

export function displayNameFromRelPath(relPath) {
  const parts = String(relPath).split("/");
  const fileName = parts[parts.length - 1] || relPath;
  return fileName.replace(/^\d+[_\-\s]/, "").replace(/\.txt$/i, "");
}

/** Build starter DSL; title section uses the file base name when possible. */
export function dslContentFromTemplate(relPath, template = DEFAULT_TAB_TEMPLATE) {
  const title = displayNameFromRelPath(relPath) || "新規ファイル";
  const base = String(template ?? DEFAULT_TAB_TEMPLATE);
  if (base.includes("新規ファイル")) {
    return base.replace("新規ファイル", title);
  }
  return base;
}

export function suggestNewTxtFileName(existingRelPaths) {
  const ids = new Set(existingRelPaths);
  let n = 1;
  while (ids.has(`新規-${n}.txt`)) n += 1;
  return `新規-${n}.txt`;
}

/** Normalize user-entered name to a relative `.txt` path. */
export function normalizeNewTxtRelPath(input) {
  let name = String(input ?? "").trim().replace(/\\/g, "/");
  if (!name) return null;
  if (name.includes("..")) return null;
  if (!/\.txt$/i.test(name)) name = `${name}.txt`;
  return name;
}

/**
 * Map disk content to in-memory editor state.
 * Blank files open as editable DSL from the default template (dirty until saved).
 */
export function normalizeFileContent(relPath, rawContent) {
  const diskContent = rawContent ?? "";

  if (!shouldInitializeAsDsl(diskContent)) {
    const { errors } = parseDSL(diskContent);
    return {
      src: diskContent,
      savedSrc: diskContent,
      needsInitialDiskSave: false,
      parseErrorPolicy: errors.length > 0 ? "continue" : null,
      initializedFromBlank: false,
    };
  }

  const src = dslContentFromTemplate(relPath);
  return {
    src,
    savedSrc: src,
    needsInitialDiskSave: true,
    parseErrorPolicy: null,
    initializedFromBlank: true,
  };
}

/** Apply filesystem content to a document when not dirty. */
export function syncDocumentFromDisk(doc, diskContent, { isDirty = false, skipStaleBlank = false } = {}) {
  if (isDirty) return doc;
  if (skipStaleBlank && isStaleBlankDiskRead(diskContent, doc.src)) {
    return doc;
  }

  const normalized = normalizeFileContent(doc.id, diskContent);
  const diskSaved = diskContent ?? "";
  return {
    ...doc,
    src: normalized.src,
    savedSrc: shouldInitializeAsDsl(diskSaved) ? doc.savedSrc : diskSaved,
    needsInitialDiskSave: normalized.needsInitialDiskSave ?? false,
    parseErrorPolicy: normalized.parseErrorPolicy,
    initializedFromBlank: normalized.initializedFromBlank,
    revision: (doc.revision ?? 0) + 1,
  };
}
