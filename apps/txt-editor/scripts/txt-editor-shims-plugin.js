import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const SHIMS = [
  {
    pattern: /[/\\]components[/\\]editor[/\\]parse-error-prompt\.jsx$/,
    target: path.join(rootDir, "src/shims/parse-error-prompt.jsx"),
  },
  {
    pattern: /[/\\]components[/\\]gui[/\\]toolbar-template-actions\.jsx$/,
    target: path.join(rootDir, "src/shims/toolbar-template-actions.jsx"),
  },
];

function resolveImport(source, importer) {
  if (!importer) return null;

  const candidates = [];
  if (source.startsWith(".")) {
    const base = path.normalize(path.resolve(path.dirname(importer), source));
    candidates.push(base, `${base}.jsx`, `${base}.js`);
  } else {
    candidates.push(path.normalize(source));
  }

  for (const candidate of candidates) {
    for (const { pattern, target } of SHIMS) {
      if (pattern.test(candidate)) return target;
    }
  }

  return null;
}

export function txtEditorShimsPlugin() {
  return {
    name: "txt-editor-shims",
    enforce: "pre",
    resolveId(source, importer) {
      return resolveImport(source, importer);
    },
  };
}
