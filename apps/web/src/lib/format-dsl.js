import { parseDSL, serializeDSL } from "@kai-swimlane/core";
import { normalizeBranchRows } from "./flow-rows.js";

/** Parse and re-serialize DSL into canonical indentation and section layout. */
export function formatDsl(src) {
  const model = parseDSL(src);
  if (model.errors?.length) return { ok: false };
  model.rows = normalizeBranchRows(model.rows);
  return { ok: true, value: serializeDSL(model) };
}
