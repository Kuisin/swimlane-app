import { parseDSL, serializeDSL } from "@kai-swimlane/core";

export function applyModelEdit(prevSrc, editFn) {
  const draft = structuredClone(parseDSL(prevSrc));
  const result = editFn(draft);
  return serializeDSL(result ?? draft);
}
