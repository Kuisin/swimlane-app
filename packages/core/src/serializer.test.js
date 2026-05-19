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
    path.join(repoRoot, "apps/web/src", name),
    "utf8"
  );
}

function normalizeModel(model) {
  return {
    title: model.title,
    lanes: model.lanes,
    blocks: model.blocks,
    props: model.props,
    rows: model.rows.map((row) => {
      const copy = { ...row };
      delete copy.id;
      delete copy.loopBranchId;
      delete copy.stepId;
      return copy;
    }),
    errors: model.errors,
  };
}

describe("serializeDSL round-trip", () => {
  for (const fixture of ["sample.txt", "default-tab-template.txt"]) {
    it(`parse → serialize → parse (${fixture})`, () => {
      const src = loadFixture(fixture);
      const first = parseDSL(src);
      const serialized = serializeDSL(first);
      const second = parseDSL(serialized);
      expect(normalizeModel(second)).toEqual(normalizeModel(first));
    });
  }
});
