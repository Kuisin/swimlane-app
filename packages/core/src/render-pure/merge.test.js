import { describe, expect, it } from "vitest";
import { parseDSL } from "../parser.js";
import { THEMES } from "../themes.js";
import { renderDiagramSvg } from "./diagram.js";

const theme = THEMES.basic;

function render(dsl) {
  return renderDiagramSvg({ model: parseDSL(dsl), theme, showStepBlockCaptions: false });
}

const MERGE = `@kai-swimlane
/role/
<a>
label: A;
<b>
label: B;
/line/
[a: 開始]
if (キャンセル?) is (あり) than #red
[a: キャンセル受付]
merge done;
else
[b: 通常処理]
endif
[a: 取引完了]
label: done;
@end`;

describe("mid-flow merge", () => {
  it("parses merge into a branchMerge row pointing at the labeled step", () => {
    const model = parseDSL(MERGE);
    expect(model.errors).toEqual([]);
    const merge = model.rows.find((r) => r.kind === "branchMerge");
    expect(merge).toBeTruthy();
    expect(merge.mergeTarget).toBe("done");
  });

  it("renders one dashed forward connector for the merge", () => {
    const svg = render(MERGE);
    // The merge connector is the only dashed path.
    expect((svg.match(/strokeDasharray=/g) || []).length).toBe(1);
  });

  it("errors when the merge target label does not exist", () => {
    const model = parseDSL(`@kai-swimlane
/role/
<a>
label: A;
/line/
if (x) is (y) than
[a: step]
merge nowhere;
endif
@end`);
    expect(model.errors.map((e) => e.msg)).toContain(
      'merge: no step with label "nowhere"',
    );
  });

  it("errors when merge is used outside an if", () => {
    const model = parseDSL(`@kai-swimlane
/role/
<a>
label: A;
/line/
[a: step]
label: home;
merge home;
@end`);
    expect(model.errors.map((e) => e.msg)).toContain("merge outside if");
  });
});
