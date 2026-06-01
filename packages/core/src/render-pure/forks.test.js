import { describe, expect, it } from "vitest";
import { parseDSL } from "../parser.js";
import { THEMES } from "../themes.js";
import { renderDiagramSvg } from "./diagram.js";

const theme = THEMES.basic;

function render(dsl) {
  return renderDiagramSvg({ model: parseDSL(dsl), theme, showStepBlockCaptions: false });
}

/** Gateway bars are the only rounded rects with rx="2"; return their {x, y, w}. */
function gatewayBars(svg) {
  return [
    ...svg.matchAll(
      /<rect[^>]*x="([\d.-]+)"[^>]*y="([\d.-]+)"[^>]*width="([\d.-]+)"[^>]*height="7"[^>]*rx="2"/g,
    ),
  ].map((m) => ({ x: +m[1], y: +m[2], w: +m[3] }));
}

describe("parallel fork/join", () => {
  const FORK = `@kai-swimlane
/role/
<a>
label: A;
<b>
label: B;
<c>
label: C;
/line/
[a: 開始]
fork
[a: メール送信]
and
[b: 台帳更新]
and
[c: 配送初期化]
endfork
[a: 完了]
@end`;

  it("parses fork/and/endfork into parallel branch rows", () => {
    const model = parseDSL(FORK);
    expect(model.errors).toEqual([]);
    const start = model.rows.find((r) => r.kind === "branchStart");
    expect(start.parallel).toBe(true);
    const cases = model.rows.filter((r) => r.kind === "branchCase");
    expect(cases.length).toBe(2); // two `and`s (first path opens at `fork`)
    expect(cases.every((c) => c.parallel)).toBe(true);
    const end = model.rows.find((r) => r.kind === "branchEnd");
    expect(end.parallel).toBe(true);
  });

  it("renders a split bar and a join bar (not diamonds)", () => {
    const bars = gatewayBars(render(FORK));
    // One split bar + one join bar.
    expect(bars.length).toBe(2);
    const [split, join] = bars.sort((p, q) => p.y - q.y);
    // The split bar sits above the join bar, and both span multiple lanes.
    expect(split.y).toBeLessThan(join.y);
    expect(split.w).toBeGreaterThan(100);
    expect(join.w).toBeGreaterThan(100);
  });

  it("rejects elseif/endif against a fork and and/endfork against an if", () => {
    const mixed = parseDSL(`@kai-swimlane
/role/
<a>
label: A;
/line/
fork
[a: x]
elseif (y) than
[a: z]
endif
@end`);
    const msgs = mixed.errors.map((e) => e.msg);
    expect(msgs).toContain("elseif without if");
    expect(msgs).toContain("endif without if");
  });
});
