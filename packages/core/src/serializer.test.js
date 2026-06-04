import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseDSL } from "./parser.js";
import { serializeDSL } from "./serializer.js";

const repoRoot = path.resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../.."
);

function loadFixture(name) {
  return readFileSync(
    path.join(repoRoot, "content", name),
    "utf8"
  );
}

function normalizeModel(model) {
  return {
    title: model.title,
    page: model.page,
    lanes: model.lanes,
    blocks: model.blocks,
    props: model.props,
    rows: model.rows.map((row) => {
      const copy = { ...row };
      delete copy.id;
      delete copy.loopBranchId;
      delete copy.mergeBranchId;
      delete copy.stepId;
      delete copy.mergeId;
      delete copy.dslLines;
      delete copy.arrowLine;
      return copy;
    }),
    errors: model.errors,
  };
}

describe("serializeDSL branch indentation", () => {
  it("aligns if, elseif, and endif; indents case body by one level (2 spaces)", () => {
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
      "if (a) is (x) than",
      "  [r: one]",
      "    elseif (y) than",
      "  [r: two]",
      "endif",
      "",
      "@end",
    ].join("\n");

    const out = serializeDSL(parseDSL(src));
    const lineSection = out.split("/line/")[1].split("@end")[0].trimEnd();
    const lines = lineSection.split("\n").map((l) => l.replace(/\r$/, ""));

    expect(lines).toContain("if (a) is (x) than");
    expect(lines).toContain("elseif (y) than");
    expect(lines).toContain("endif");
    expect(lines).toContain("  [r: one]");
    expect(lines).toContain("  [r: two]");

    const ifLine = lines.find((l) => l.startsWith("if "));
    const elseifLine = lines.find((l) => l.startsWith("elseif "));
    const endifLine = lines.find((l) => l === "endif");
    const stepLine = lines.find((l) => l.includes("[r: one]"));

    expect(leadingSpaces(ifLine)).toBe(0);
    expect(leadingSpaces(elseifLine)).toBe(0);
    expect(leadingSpaces(endifLine)).toBe(0);
    expect(leadingSpaces(stepLine)).toBe(2);
  });
});

function leadingSpaces(line) {
  const m = line.match(/^ */);
  return m ? m[0].length : 0;
}

describe("serializeDSL round-trip", () => {
  for (const fixture of [
    "sample.txt",
    "default-tab-template.txt",
    "complex-test-example.txt",
  ]) {
    it(`parse → serialize → parse (${fixture})`, () => {
      const src = loadFixture(fixture);
      const first = parseDSL(src);
      const serialized = serializeDSL(first);
      const second = parseDSL(serialized);
      expect(normalizeModel(second)).toEqual(normalizeModel(first));
    });
  }

  it("round-trips fork/and/endfork and merge", () => {
    const src = [
      "@kai-swimlane",
      "",
      "/title/",
      "t",
      "",
      "/role/",
      "",
      "<a>",
      "label: A;",
      "",
      "<b>",
      "label: B;",
      "",
      "/line/",
      "",
      "fork #purple",
      "  [a: one]",
      "and",
      "  [b: two]",
      "endfork",
      "",
      "if (x) is (yes) than #red",
      "  [a: cancel]",
      "  merge: done;",
      "else",
      "  [b: normal]",
      "endif",
      "",
      "[a: finish]",
      "id: done;",
      "label: done;",
      "",
      "@end",
    ].join("\n");
    const first = parseDSL(src);
    expect(first.errors).toEqual([]);
    const second = parseDSL(serializeDSL(first));
    expect(second.errors).toEqual([]);
    expect(normalizeModel(second)).toEqual(normalizeModel(first));
  });

  it("parses and serializes else than #color", () => {
    const src = [
      "@kai-swimlane",
      "",
      "/title/",
      "t",
      "",
      "/role/",
      "",
      "<a>",
      "label: A;",
      "",
      "/line/",
      "",
      "if (x) is (yes) than",
      "  [a: ok]",
      "else than #red",
      "  [a: fallback]",
      "endif",
      "",
      "@end",
    ].join("\n");

    const first = parseDSL(src);
    expect(first.errors).toEqual([]);
    const elseCase = first.rows.find(
      (row) => row.kind === "branchCase" && /^else$/i.test(row.label || ""),
    );
    expect(elseCase?.branchColor).toBe("red");

    const out = serializeDSL(first);
    expect(out).toContain("else than #red");

    const second = parseDSL(out);
    expect(second.errors).toEqual([]);
    expect(normalizeModel(second)).toEqual(normalizeModel(first));
  });
});
