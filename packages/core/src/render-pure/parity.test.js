import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseDSL } from "../parser.js";
import { THEMES } from "../themes.js";
import { Diagram } from "../diagram/diagram.jsx";
import { PartsPreviewStatic } from "../parts-preview-static.jsx";
import { TemplatePartsPreview } from "../template-parts-preview.jsx";
import { renderDiagramSvg } from "./diagram.js";
import { renderPartsPreviewHtml } from "./parts-preview-static.js";
import { renderTemplatePartsPreviewHtml } from "./template-parts-preview.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../../../..");

function readFixture(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

import { normalizeMarkup } from "./normalize-markup.js";

function renderReactDiagram(model, theme, options = {}) {
  return renderToStaticMarkup(
    React.createElement(Diagram, {
      model,
      theme,
      showStepBlockCaptions: false,
      ...options,
    }),
  );
}

const PARTS_SAMPLE = `@kai-swimlane-parts
/block/ start shape=ellipse icon=#play
/block/ end shape=ellipse icon=#check
/prop/ doc side=right
@end
`;

function firstDiff(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return { index: i, a: a.slice(Math.max(0, i - 60), i + 100), b: b.slice(Math.max(0, i - 60), i + 100) };
    }
  }
  return null;
}

describe("render-pure parity", () => {
  const theme = THEMES.basic;

  it("matches React Diagram for sample.txt", () => {
    const model = parseDSL(readFixture("content/sample.txt"));
    const reactSvg = renderReactDiagram(model, theme);
    const pureSvg = renderDiagramSvg({
      model,
      theme,
      showStepBlockCaptions: false,
    });
    const pure = normalizeMarkup(pureSvg);
    const react = normalizeMarkup(reactSvg);
    const diff = firstDiff(pure, react);
    expect(diff, diff ? JSON.stringify(diff) : undefined).toBeNull();
  });

  it("matches React Diagram for default-tab-template.txt", () => {
    const model = parseDSL(readFixture("content/default-tab-template.txt"));
    const reactSvg = renderReactDiagram(model, theme);
    const pureSvg = renderDiagramSvg({
      model,
      theme,
      showStepBlockCaptions: false,
    });
    const pure = normalizeMarkup(pureSvg);
    const react = normalizeMarkup(reactSvg);
    const diff = firstDiff(pure, react);
    expect(diff, diff ? JSON.stringify(diff) : undefined).toBeNull();
  });

  it("matches React Diagram for complex-test-example.txt (fork + merge)", () => {
    const model = parseDSL(
      readFixture("content/complex-test-example.txt"),
    );
    const reactSvg = renderReactDiagram(model, theme);
    const pureSvg = renderDiagramSvg({
      model,
      theme,
      showStepBlockCaptions: false,
    });
    const pure = normalizeMarkup(pureSvg);
    const react = normalizeMarkup(reactSvg);
    const diff = firstDiff(pure, react);
    expect(diff, diff ? JSON.stringify(diff) : undefined).toBeNull();
  });

  it("matches PartsPreviewStatic for parts fence", () => {
    const reactHtml = renderToStaticMarkup(
      React.createElement(PartsPreviewStatic, { code: PARTS_SAMPLE, theme }),
    );
    const pureHtml = renderPartsPreviewHtml(PARTS_SAMPLE, theme);
    expect(normalizeMarkup(pureHtml)).toBe(normalizeMarkup(reactHtml));
  });

  it("matches TemplatePartsPreview structure for parts fence", () => {
    const reactHtml = renderToStaticMarkup(
      React.createElement(TemplatePartsPreview, { code: PARTS_SAMPLE, theme }),
    );
    const pureHtml = renderTemplatePartsPreviewHtml(PARTS_SAMPLE, theme);
    expect(normalizeMarkup(pureHtml)).toBe(normalizeMarkup(reactHtml));
  });
});
