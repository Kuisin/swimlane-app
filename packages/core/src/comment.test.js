import { describe, expect, it } from "vitest";
import { isDslCommentLine, parseDSL } from "./parser.js";

describe("DSL comments", () => {
  it("isDslCommentLine recognizes // and ***", () => {
    expect(isDslCommentLine("// note")).toBe(true);
    expect(isDslCommentLine("  // indented")).toBe(true);
    expect(isDslCommentLine("*** legacy ***")).toBe(true);
    expect(isDslCommentLine("[r: http://host/path]")).toBe(false);
    expect(isDslCommentLine("if (x) is (y) than")).toBe(false);
  });

  it("ignores // lines in /line/", () => {
    const src = [
      "@kai-swimlane",
      "",
      "/title/",
      "t",
      "",
      "/role/",
      "",
      "<r>",
      "label: R;",
      "",
      "/line/",
      "",
      "// before step",
      "[r: only step]",
      "// after step",
      "",
      "@end",
    ].join("\n");

    const model = parseDSL(src);
    expect(model.errors).toEqual([]);
    const steps = model.rows.filter((r) => r.kind === "step" && !r.empty);
    expect(steps).toHaveLength(1);
    expect(steps[0].text).toBe("only step");
  });
});
