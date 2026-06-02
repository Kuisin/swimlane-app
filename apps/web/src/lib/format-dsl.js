import { parseDSL, serializeDSL } from "@kai-swimlane/core";
import { normalizeBranchRows } from "./flow-rows";

/**
 * Parse and re-serialize DSL into canonical layout:
 * - if / elseif / else / endif and fork / and / endfork indentation
 * - section / end-section and branch / end-branch groups
 * - merge: <id>;, arrow: <type>;, and step id: / label: / desc: / remark: /
 *   props: ordering
 * Comments (// and ***) and multi-line ``` fence content are preserved.
 */
export function formatDsl(src) {
  const model = parseDSL(src);
  if (model.errors?.length) return { ok: false, errors: model.errors };
  model.rows = normalizeBranchRows(model.rows);
  return { ok: true, value: serializeDSL(model) };
}
