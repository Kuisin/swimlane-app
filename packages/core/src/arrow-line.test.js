import { describe, expect, it } from "vitest";
import { parseDSL } from "./parser.js";
import { serializeDSL } from "./serializer.js";
import {
  arrowLineStrokeProps,
  normalizeArrowLine,
  stepOutgoingArrowLine,
} from "./arrow-line.js";

describe("arrow line type", () => {
  const base = [
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
    "[r: one]",
    "arrow: dashed;",
    "[r: two]",
    "",
    "@end",
  ].join("\n");

  it("parses arrow: on preceding step", () => {
    const model = parseDSL(base);
    const steps = model.rows.filter((r) => r.kind === "step" && !r.empty);
    expect(steps[0].arrowLine).toBe("dashed");
    expect(steps[1].arrowLine).toBeUndefined();
  });

  it("serializes non-solid arrow lines", () => {
    const out = serializeDSL(parseDSL(base));
    expect(out).toContain("arrow: dashed;");
    expect(out).not.toMatch(/arrow:\s*solid;/i);
  });

  it("rejects invalid arrow values", () => {
    const bad = base.replace("arrow: dashed;", "arrow: wavy;");
    const model = parseDSL(bad);
    expect(model.errors.some((e) => /solid, dashed, or dotted/i.test(e.msg))).toBe(
      true,
    );
  });

  it("stroke props and stepOutgoingArrowLine", () => {
    expect(arrowLineStrokeProps("dashed")).toEqual({ strokeDasharray: "6 3" });
    expect(arrowLineStrokeProps("dotted")).toEqual({ strokeDasharray: "2 3" });
    expect(arrowLineStrokeProps("solid")).toEqual({});
    expect(normalizeArrowLine("Dashed")).toBe("dashed");
    expect(stepOutgoingArrowLine({ arrowLine: "dotted" })).toBe("dotted");
    expect(stepOutgoingArrowLine({})).toBe("solid");
  });
});
