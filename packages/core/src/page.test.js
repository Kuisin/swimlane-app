import { describe, expect, it } from "vitest";
import { parseDSL } from "./parser.js";
import { serializeDSL } from "./serializer.js";

describe("/page/ section", () => {
  it("parses page metadata and multiline step desc", () => {
    const src = [
      "@kai-swimlane",
      "",
      "/page/",
      "description: Subtitle under the title;",
      "header-left: ACME Corp;",
      "header-center: Process v1;",
      "header-right: 2026-05-24;",
      "footer-left: Internal;",
      "footer-center: Page 1;",
      "footer-right: Confidential;",
      "",
      "/option/",
      "show-right-remarks: false;",
      "show-left-remarks: true;",
      "show-left-gutter: true;",
      "show-step-block-captions: false;",
      "merge-at-previous-block: false;",
      "left-title: Procedure;",
      "left-subtitle: Description;",
      "right-title: Remark;",
      "right-subtitle: Notes;",
      "",
      "/title/",
      "Order flow",
      "",
      "/role/",
      "",
      "<sales>",
      "label: Sales;",
      "",
      "/line/",
      "",
      "[sales: Receive order]",
      "desc: ```",
      "Line one",
      "Line two",
      "```;",
      "remark: ```",
      "External memo",
      "",
      "Need manual confirmation",
      "with accounting team",
      "```;",
      "",
      "@end",
    ].join("\n");

    const model = parseDSL(src);
    expect(model.errors).toEqual([]);
    expect(model.page).toMatchObject({
      description: "Subtitle under the title",
      headerLeft: "ACME Corp",
      headerCenter: "Process v1",
      headerRight: "2026-05-24",
      footerLeft: "Internal",
      footerCenter: "Page 1",
      footerRight: "Confidential",
      leftTitle: "Procedure",
      leftSubtitle: "Description",
      rightTitle: "Remark",
      rightSubtitle: "Notes",
    });
    expect(model.options).toMatchObject({
      showRightRemarks: false,
      showLeftRemarks: true,
      showLeftGutter: true,
      showStepBlockCaptions: false,
      mergeAtPreviousBlock: false,
    });
    expect(model.rows[0].description).toBe("Line one\nLine two");
    expect(model.rows[0].remark).toBe(
      "External memo\n\nNeed manual confirmation\nwith accounting team",
    );

    const serialized = serializeDSL(model);
    const roundTrip = parseDSL(serialized);
    expect(roundTrip.errors).toEqual([]);
    expect(roundTrip.page).toEqual(model.page);
    expect(roundTrip.rows[0].description).toBe("Line one\nLine two");
    expect(roundTrip.rows[0].remark).toBe(
      "External memo\n\nNeed manual confirmation\nwith accounting team",
    );
  });
});
