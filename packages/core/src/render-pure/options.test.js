import { describe, expect, it } from "vitest";
import { parseDSL } from "../parser.js";
import { THEMES } from "../themes.js";
import { renderDiagramSvg } from "./diagram.js";

const theme = THEMES.basic;

const DSL = `@kai-swimlane
/role/
<a>
label: A;
/prop/
<L>
label: LEFTDOC;
side: left;
<R>
label: RIGHTDOC;
side: right;
/line/
[a: blockbody]
label: GUTTERONLY;
props: L,R;
@end`;

function render(opts) {
  return renderDiagramSvg({
    model: parseDSL(DSL),
    theme,
    showStepBlockCaptions: false,
    ...opts,
  });
}

describe("display option toggles", () => {
  it("show all by default", () => {
    const svg = render({});
    expect(svg).toContain("GUTTERONLY"); // left gutter title
    expect(svg).toContain("LEFTDOC"); // left remark chip
    expect(svg).toContain("RIGHTDOC"); // right remark chip
  });

  it("showLeftGutter=false hides the left gutter column", () => {
    const svg = render({ showLeftGutter: false });
    expect(svg).not.toContain("GUTTERONLY");
    // remark chips are independent of the gutter
    expect(svg).toContain("LEFTDOC");
    expect(svg).toContain("RIGHTDOC");
  });

  it("showLeftRemarks=false hides left-side remark chips only", () => {
    const svg = render({ showLeftRemarks: false });
    expect(svg).not.toContain("LEFTDOC");
    expect(svg).toContain("RIGHTDOC");
    expect(svg).toContain("GUTTERONLY");
  });

  it("showRightRemarks=false hides right-side remark chips only", () => {
    const svg = render({ showRightRemarks: false });
    expect(svg).not.toContain("RIGHTDOC");
    expect(svg).toContain("LEFTDOC");
    expect(svg).toContain("GUTTERONLY");
  });
});
