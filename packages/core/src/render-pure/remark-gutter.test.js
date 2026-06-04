import { describe, expect, it } from "vitest";
import { resolveDiagramOptions } from "../diagram-options.js";
import { parseDSL } from "../parser.js";
import { THEMES } from "../themes.js";
import { renderDiagramSvg } from "./diagram.js";

const theme = THEMES.basic;

function render(dsl) {
  const model = parseDSL(dsl);
  const opts = resolveDiagramOptions(model.options);
  return renderDiagramSvg({
    model,
    theme,
    showStepBlockCaptions: false,
    ...opts,
  });
}

const WITH_REMARK = `@kai-swimlane
/page/
left-title: Procedure;
left-subtitle: Description;
right-title: REMARKCOL;
/role/
<a>
label: A;
/line/
[a: Submit]
label: Submit;
remark: NEEDSAPPROVAL;
@end`;

const WITHOUT_REMARK = `@kai-swimlane
/page/
right-title: REMARKCOL;
/role/
<a>
label: A;
/line/
[a: Submit]
label: Submit;
@end`;

const WITHOUT_REMARK_GUTTER_OFF = `@kai-swimlane
/option/
show-right-gutter: false;
/page/
right-title: REMARKCOL;
/role/
<a>
label: A;
/line/
[a: Submit]
label: Submit;
@end`;

describe("right remark gutter", () => {
  it("renders the right-title header, left titles, and per-step remark text", () => {
    const svg = render(WITH_REMARK);
    expect(svg).toContain("Procedure");
    expect(svg).toContain("Description");
    expect(svg).toContain("REMARKCOL");
    expect(svg).toContain("NEEDSAPPROVAL");
  });

  it("shows right gutter when show-right-gutter is true even without remark text", () => {
    const svg = render(WITHOUT_REMARK);
    expect(svg).toContain("REMARKCOL");
  });

  it("hides right gutter when show-right-gutter is false", () => {
    const svg = render(WITHOUT_REMARK_GUTTER_OFF);
    expect(svg).not.toContain("REMARKCOL");
  });

  it("widens the diagram when show-right-gutter is enabled", () => {
    const w = (svg) => +svg.match(/viewBox="0 0 ([\d.]+)/)[1];
    expect(w(render(WITH_REMARK))).toBeGreaterThan(w(render(WITHOUT_REMARK_GUTTER_OFF)));
    expect(w(render(WITHOUT_REMARK))).toBeGreaterThan(w(render(WITHOUT_REMARK_GUTTER_OFF)));
  });
});
