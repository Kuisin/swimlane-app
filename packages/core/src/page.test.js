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
    });
    expect(model.rows[0].description).toBe("Line one\nLine two");

    const serialized = serializeDSL(model);
    const roundTrip = parseDSL(serialized);
    expect(roundTrip.errors).toEqual([]);
    expect(roundTrip.page).toEqual(model.page);
    expect(roundTrip.rows[0].description).toBe("Line one\nLine two");
  });
});
