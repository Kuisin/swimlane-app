import { describe, expect, it } from "vitest";
import { parseDSL, serializeDSL } from "./index.js";

/** Mirrors apps/web formatDsl: parse → normalize is GUI-only; here test serialize output. */
function formatLikeWeb(src) {
  const model = parseDSL(src);
  if (model.errors?.length) return { ok: false, errors: model.errors };
  return { ok: true, value: serializeDSL(model) };
}

describe("DSL format (fork / merge / step id)", () => {
  it("formats fork, merge, and id lines with canonical indentation", () => {
    const messy = [
      "@kai-swimlane",
      "/role/",
      "<a>",
      "label: A;",
      "/line/",
      "fork #purple",
      "[a: one]",
      "and",
      "[b: two]",
      "endfork",
      "if (x) is (y) than",
      "[a: cancel]",
      "merge: done;",
      "endif",
      "[a: finish]",
      "label: 完了;",
      "id: done;",
      "@end",
    ].join("\n");

    const { ok, value } = formatLikeWeb(messy);
    expect(ok).toBe(true);
    expect(value).toContain("fork #purple");
    expect(value).toContain("\nand\n");
    expect(value).toContain("endfork");
    expect(value).toContain("  merge: done;");
    expect(value).toContain("id: done;");
    expect(value).toMatch(/id: done;\s*\n\s*label: 完了;/);
    expect(parseDSL(value).errors).toEqual([]);
  });

  it("preserves // and *** comments and comment-like fence content", () => {
    const src = [
      "@kai-swimlane",
      "/page/",
      "description: ```",
      "line one",
      "// looks like a comment but is description content",
      "```;",
      "/role/",
      "<a>",
      "label: A;",
      "/line/",
      "// a flow comment",
      "[a: one]",
      "*** a section note ***",
      "section (box)",
      "[a: two]",
      "end-section",
      "// trailing comment",
      "@end",
    ].join("\n");

    const { ok, value } = formatLikeWeb(src);
    expect(ok).toBe(true);
    expect(value).toContain("// a flow comment");
    expect(value).toContain("*** a section note ***");
    expect(value).toContain("// trailing comment");
    // A fence body line that looks like a comment must survive verbatim.
    expect(value).toContain("// looks like a comment but is description content");
    expect(parseDSL(value).errors).toEqual([]);
  });

  it("keeps explicit options even when they equal the defaults", () => {
    const src = [
      "@kai-swimlane",
      "/option/",
      "show-left-gutter: true;",
      "left-title: Procedure;", // equals the default
      "left-subtitle: Description;", // equals the default
      "right-subtitle: メモ;", // override
      "/role/",
      "<a>",
      "label: A;",
      "/line/",
      "[a: x]",
      "@end",
    ].join("\n");

    const { ok, value } = formatLikeWeb(src);
    expect(ok).toBe(true);
    expect(value).toContain("show-left-gutter: true;");
    expect(value).toContain("left-title: Procedure;");
    expect(value).toContain("left-subtitle: Description;");
    expect(value).toContain("right-subtitle: メモ;");

    // A document without any options must not gain an /option/ section.
    const bare = formatLikeWeb(
      ["@kai-swimlane", "/role/", "<a>", "label: A;", "/line/", "[a: x]", "@end"].join("\n"),
    );
    expect(bare.value).not.toContain("/option/");
  });

  it("fails format when merge id is missing or duplicate", () => {
    const missing = formatLikeWeb(`@kai-swimlane
/role/
<a>
label: A;
/line/
if (a) is (b) than
[a: x]
merge: ghost;
endif
@end`);
    expect(missing.ok).toBe(false);

    const dup = formatLikeWeb(`@kai-swimlane
/role/
<a>
label: A;
/line/
[a: one]
id: dup;
[a: two]
id: dup;
@end`);
    expect(dup.ok).toBe(false);
    expect(dup.errors?.some((e) => e.msg.includes('duplicate step id "dup"'))).toBe(
      true,
    );
  });
});
