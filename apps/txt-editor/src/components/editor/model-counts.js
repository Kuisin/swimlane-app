export function getModelCounts(model) {
  return {
    roles: model.lanes?.length ?? 0,
    blocks: Object.keys(model.blocks || {}).length,
    props: Object.keys(model.props || {}).length,
    steps: (model.rows || []).filter((row) => row.kind === "step").length,
  };
}
