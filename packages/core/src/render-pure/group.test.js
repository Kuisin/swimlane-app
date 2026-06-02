import { describe, expect, it } from "vitest";
import { parseDSL, serializeDSL } from "../index.js";
import { THEMES } from "../themes.js";
import { isInsideGroup } from "../group-rows.js";
import { renderDiagramSvg } from "./diagram.js";

const theme = THEMES.basic;

function render(dsl) {
  return renderDiagramSvg({ model: parseDSL(dsl), theme, showStepBlockCaptions: false });
}

const GROUP_BYPASS = `@kai-swimlane
/role/
<a>
label: A;
<b>
label: B;
/line/
[a: before]
section (Audit Detail) #blue
  [b: detail one]
  [b: detail two]
end-section
[a: after]
@end`;

describe("section grouping", () => {
  it("parses section and end-section rows", () => {
    const model = parseDSL(GROUP_BYPASS);
    expect(model.errors).toEqual([]);
    expect(model.rows.map((r) => r.kind)).toEqual([
      "step",
      "groupStart",
      "step",
      "step",
      "groupEnd",
      "step",
    ]);
    expect(model.rows[1].kind).toBe("groupStart");
    expect(model.rows[4].kind).toBe("groupEnd");
    expect(model.rows[1].id).toBe(model.rows[4].id);
    expect(model.rows[1].sectionName).toBe("Audit Detail");
    expect(model.rows[1].sectionColor).toBe("blue");
  });

  it("accepts legacy branch / end-branch aliases", () => {
    const model = parseDSL(`@kai-swimlane
/role/
<a>
label: A;
<b>
label: B;
/line/
[a: before]
branch (Legacy Detail) #purple
  [b: inside]
end-branch
[a: after]
@end`);
    expect(model.errors).toEqual([]);
    expect(model.rows[1].kind).toBe("groupStart");
    expect(model.rows[1].sectionName).toBe("Legacy Detail");
    expect(model.rows[1].sectionColor).toBe("purple");
    expect(model.rows[3].kind).toBe("groupEnd");
  });

  it("marks interior steps as inside the group", () => {
    const model = parseDSL(GROUP_BYPASS);
    expect(isInsideGroup(model.rows, 0)).toBe(false);
    expect(isInsideGroup(model.rows, 2)).toBe(true);
    expect(isInsideGroup(model.rows, 3)).toBe(true);
    expect(isInsideGroup(model.rows, 5)).toBe(false);
  });

  it("renders main-flow bypass and interior detail connectors", () => {
    const svg = render(GROUP_BYPASS);
    expect((svg.match(/markerEnd/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(svg).toContain("Audit Detail");
    const model = parseDSL(GROUP_BYPASS);
    const beforeIdx = model.rows.findIndex(
      (r) => r.kind === "step" && r.text === "before",
    );
    const afterIdx = model.rows.findIndex(
      (r) => r.kind === "step" && r.text === "after",
    );
    const innerIdx = model.rows.findIndex(
      (r) => r.kind === "step" && r.text === "detail two",
    );
    expect(beforeIdx).toBeGreaterThanOrEqual(0);
    expect(afterIdx).toBeGreaterThan(beforeIdx);
    expect(innerIdx).toBeGreaterThan(beforeIdx);
    expect(innerIdx).toBeLessThan(afterIdx);
  });

  it("bypasses a detail group when fork follows end-section", () => {
    const dsl = `@kai-swimlane
/role/
<a> label: A;
<b> label: B;
/line/
[a: 注文サマリー]
section (Parallel Detail) #green
  [b: 監査明細]
end-section
fork
  [a: パス1]
and
  [b: パス2]
endfork
@end`;
    const model = parseDSL(dsl);
    expect(model.errors).toEqual([]);
    const svg = render(dsl);
    expect(svg).toMatch(/M 449 190 L 449 [\d.]+ L 667 [\d.]+ L 667 351/);
  });

  it("round-trips through serializeDSL", () => {
    const model = parseDSL(GROUP_BYPASS);
    const text = serializeDSL(model);
    expect(text).toContain("section (Audit Detail) #blue");
    expect(text).toContain("end-section");
    expect(parseDSL(text).errors).toEqual([]);
  });

  it("errors on end-section without section", () => {
    const model = parseDSL(`@kai-swimlane
/role/
<a>
label: A;
/line/
end-section
@end`);
    expect(model.errors.map((e) => e.msg)).toContain("end-section without section");
  });

  it("errors on unclosed section", () => {
    const model = parseDSL(`@kai-swimlane
/role/
<a>
label: A;
/line/
section (legacy)
[a: detail]
@end`);
    expect(model.errors.map((e) => e.msg)).toContain(
      "unclosed section (missing end-section)",
    );
  });
});
