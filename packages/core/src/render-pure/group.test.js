import { describe, expect, it } from "vitest";
import { parseDSL, serializeDSL } from "../index.js";
import { THEMES } from "../themes.js";
import { isInsideBranchGroup, groupModeOf } from "../group-rows.js";
import { renderDiagramSvg } from "./diagram.js";

const theme = THEMES.basic;

function render(dsl) {
  return renderDiagramSvg({ model: parseDSL(dsl), theme, showStepBlockCaptions: false });
}

/** A section box is the only dashed rounded rect. */
function dashedBoxes(svg) {
  return (svg.match(/strokeDasharray="6 4"/g) || []).length;
}

const SECTION = `@kai-swimlane
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

const BRANCH = `@kai-swimlane
/role/
<a>
label: A;
<b>
label: B;
/line/
[a: before]
branch (Side Work) #purple
  [b: sub one]
  [b: sub two]
end-branch
[a: after]
@end`;

describe("section (visual box)", () => {
  it("tags the group with mode 'section'", () => {
    const model = parseDSL(SECTION);
    expect(model.errors).toEqual([]);
    expect(model.rows.map((r) => r.kind)).toEqual([
      "step",
      "groupStart",
      "step",
      "step",
      "groupEnd",
      "step",
    ]);
    expect(groupModeOf(model.rows[1])).toBe("section");
    expect(model.rows[1].sectionName).toBe("Audit Detail");
    expect(model.rows[1].sectionColor).toBe("blue");
  });

  it("draws a box but keeps interior steps on the main flow", () => {
    const model = parseDSL(SECTION);
    // Section steps stay on the main flow (not a side branch).
    expect(isInsideBranchGroup(model.rows, 2)).toBe(false);
    expect(isInsideBranchGroup(model.rows, 3)).toBe(false);
    const svg = render(SECTION);
    expect(svg).toContain("Audit Detail");
    expect(dashedBoxes(svg)).toBe(1);
  });

  it("round-trips through serializeDSL", () => {
    const text = serializeDSL(parseDSL(SECTION));
    expect(text).toContain("section (Audit Detail) #blue");
    expect(text).toContain("end-section");
    expect(parseDSL(text).errors).toEqual([]);
  });
});

describe("branch (mid-flow sub-branch)", () => {
  it("tags the group with mode 'branch'", () => {
    const model = parseDSL(BRANCH);
    expect(model.errors).toEqual([]);
    expect(groupModeOf(model.rows[1])).toBe("branch");
    expect(model.rows[1].sectionName).toBe("Side Work");
    expect(model.rows[1].sectionColor).toBe("purple");
  });

  it("treats interior steps as a side branch and draws no box", () => {
    const model = parseDSL(BRANCH);
    expect(isInsideBranchGroup(model.rows, 2)).toBe(true);
    expect(isInsideBranchGroup(model.rows, 3)).toBe(true);
    const svg = render(BRANCH);
    expect(svg).not.toContain("Side Work"); // branch draws no labelled box
    expect(dashedBoxes(svg)).toBe(0);
  });

  it("merges to the main flow after end-branch (no crash with fork after)", () => {
    const dsl = `@kai-swimlane
/role/
<a> label: A;
<b> label: B;
/line/
[a: start]
branch (Side)
  [b: s1]
  [b: s2]
end-branch
fork
  [a: p1]
and
  [b: p2]
endfork
@end`;
    const model = parseDSL(dsl);
    expect(model.errors).toEqual([]);
    expect(() => render(dsl)).not.toThrow();
  });

  it("round-trips through serializeDSL as branch / end-branch", () => {
    const text = serializeDSL(parseDSL(BRANCH));
    expect(text).toContain("branch (Side Work) #purple");
    expect(text).toContain("end-branch");
    expect(parseDSL(text).errors).toEqual([]);
  });
});

describe("group errors", () => {
  it("errors on end-section without an open group", () => {
    const model = parseDSL(`@kai-swimlane
/role/
<a>
label: A;
/line/
end-section
@end`);
    expect(model.errors.map((e) => e.msg)).toContain("end-section without section");
  });

  it("errors on an unclosed group", () => {
    const model = parseDSL(`@kai-swimlane
/role/
<a>
label: A;
/line/
section (open)
[a: detail]
@end`);
    expect(model.errors.map((e) => e.msg)).toContain(
      "unclosed section (missing end-section)",
    );
  });
});
