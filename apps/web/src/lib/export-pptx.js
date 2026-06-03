/**
 * PPTX export — embeds one SVG per slide (vector, not rasterised).
 *
 * Page splits:
 *   • Only break before a step row, never mid-row.
 *   • Row heights are computed using the same formula as the renderer so the
 *     budget exactly matches the rendered SVG.
 *
 * Every slide:
 *   • Header section  (lane-header strip + start-terminal gap)  — repeated
 *   • Content section (the rows for this page)
 *   • Footer section  (footer text strip, when the model has one) — repeated
 *
 * PowerPoint-friendly sizing:
 *   • Outer SVG width / height are set to the actual display pixels so that
 *     PowerPoint's "Convert to Shape" uses the correct coordinate-to-pt scale.
 */

import { parseDSL, THEMES } from "@kai-swimlane/core";
import { renderDiagramSvg } from "@kai-swimlane/core/render-pure";
import { triggerDownload } from "./export.js";

// ─── Constants matching packages/core/src/render-pure/diagram.js ──────────────
const ROW_H               = 80;
const HEADER_H            = 72;   // lane-header strip height
const GRID_TOP_PAD        = 40;   // gap between header bottom and first row (line 279)
const HEADER_SECTION_H    = HEADER_H + GRID_TOP_PAD; // 112 — header + terminal gap
const FOOTER_H            = 44;   // pageFooterPad when footer exists
const PROP_EXTRA_BASE     = 20;   // propRowExtraHBase
const PROP_EXTRA_PER      = 18;   // propRowExtraHPerProps

// ─── Row height — exact match to renderer (no-gutter path) ───────────────────
function stepRowH(row, model) {
  if (!row || row.kind !== "step" || row.empty) return ROW_H;
  let left = 0, right = 0;
  for (const pId of row.props || []) {
    if (model.props?.[pId]?.side === "left") left++;
    else right++;
  }
  const maxSide = Math.max(left, right);
  const propExtra = maxSide > 0 ? PROP_EXTRA_BASE + Math.max(0, maxSide - 1) * PROP_EXTRA_PER : 0;
  return ROW_H + propExtra;
}

function rowH(row, model) {
  switch (row.kind) {
    case "step":        return stepRowH(row, model);
    case "branchStart": return row.parallel ? 40 : 90;
    case "branchEnd":   return 60;
    case "branchCase":  return 0;
    case "branchMerge": return 12;
    case "branchLoop":  return 12;
    case "groupStart":  return 16;
    case "groupEnd":    return 16;
    default:            return ROW_H;
  }
}

// ─── topPad — exact match to renderer ─────────────────────────────────────────
function computeTopPad(model) {
  const title  = model.title?.trim();
  const hasHdr = Boolean(
    model.page?.headerLeft?.trim() ||
    model.page?.headerCenter?.trim() ||
    model.page?.headerRight?.trim()
  );
  const hasDesc = Boolean(model.page?.description?.trim());

  if (!hasHdr && !hasDesc && title)  return 84;
  if (!hasHdr && !hasDesc && !title) return 40;

  let layoutY = 18;
  if (hasHdr)  layoutY += 32;
  if (title)   layoutY += 38;
  if (hasDesc) layoutY += (model.page.description.split("\n").length * 16) + 18;
  return Math.max(layoutY + 20, title || hasDesc ? 84 : 40);
}

function hasPageFooter(model) {
  return Boolean(
    model.page?.footerLeft?.trim() ||
    model.page?.footerCenter?.trim() ||
    model.page?.footerRight?.trim()
  );
}

// ─── Page slice computation ────────────────────────────────────────────────────
// Returns an array of { contentRelStart, contentRelEnd } (content-relative Y,
// where 0 = top of first row in SVG).
// Breaks only before step rows; last slice extends to include bottom padding.
function computeSlices(model, svgW, svgH, slideW, slideH, margin) {
  const topPad     = computeTopPad(model);
  const footerH    = hasPageFooter(model) ? FOOTER_H : 0;
  const footerAbsY = footerH > 0 ? svgH - footerH : svgH;

  // Absolute SVG Y where content rows start
  const contentAbsStart = topPad + HEADER_SECTION_H;
  // Total SVG units available for content rows on the last page
  const maxContentRelH  = footerAbsY - contentAbsStart;

  const scale  = (slideW - 2 * margin) / svgW;
  const sliceH = (slideH - 2 * margin) / scale; // SVG units per slide

  // Per-page height budgets (SVG units available for content rows)
  // Page 1 includes title area; page N+ only the header section and footer
  const budget = [
    Math.max(ROW_H, sliceH - (topPad + HEADER_SECTION_H) - footerH),
    Math.max(ROW_H, sliceH - HEADER_SECTION_H - footerH),
  ];

  const slices  = [];
  let pageStart = 0;   // content-relative Y
  let curY      = 0;
  let bi        = 0;   // 0 = first page, 1 = later pages

  for (const row of model.rows || []) {
    const h = rowH(row, model);
    if (h > 0 && row.kind === "step" && curY + h - pageStart > budget[bi]) {
      slices.push({ contentRelStart: pageStart, contentRelEnd: curY });
      pageStart = curY;
      bi = 1;
    }
    curY += h;
  }

  // Last slice: extend content down to include bottom padding / end terminal
  slices.push({
    contentRelStart: pageStart,
    contentRelEnd: Math.max(curY + 40, maxContentRelH), // +40 for end-terminal gap
  });

  return { slices, topPad, footerH, footerAbsY, contentAbsStart, scale };
}

// ─── SVG cleanup (browser-side DOM manipulation) ──────────────────────────────
function parsePathPoints(d) {
  const pts = [];
  const re  = /[ML]\s*([-+]?\d+(?:\.\d+)?)\s+([-+]?\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(d)) !== null) pts.push([parseFloat(m[1]), parseFloat(m[2])]);
  return pts;
}

function cleanSvgEl(svgEl) {
  const SVG_NS = "http://www.w3.org/2000/svg";

  // Inline marker-end arrowheads as <polygon> elements
  svgEl.querySelectorAll("[marker-end]").forEach((el) => {
    const stroke = el.getAttribute("stroke") || "#334155";
    let from = null, to = null;
    const tag = el.tagName.toLowerCase();
    if (tag === "line") {
      from = [parseFloat(el.getAttribute("x1")), parseFloat(el.getAttribute("y1"))];
      to   = [parseFloat(el.getAttribute("x2")), parseFloat(el.getAttribute("y2"))];
    } else if (tag === "path") {
      const pts = parsePathPoints(el.getAttribute("d") || "");
      if (pts.length >= 2) { from = pts.at(-2); to = pts.at(-1); }
    }
    if (!from || !to || Math.hypot(to[0] - from[0], to[1] - from[1]) < 0.5) return;
    const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
    const L = 10, W = 5;
    const bx = to[0] - L * Math.cos(angle);
    const by = to[1] - L * Math.sin(angle);
    const f  = (n) => n.toFixed(2);
    const poly = document.createElementNS(SVG_NS, "polygon");
    poly.setAttribute("points", [
      `${f(to[0])},${f(to[1])}`,
      `${f(bx + W * Math.sin(angle))},${f(by - W * Math.cos(angle))}`,
      `${f(bx - W * Math.sin(angle))},${f(by + W * Math.cos(angle))}`,
    ].join(" "));
    poly.setAttribute("fill", stroke);
    el.removeAttribute("marker-end");
    el.parentNode.insertBefore(poly, el.nextSibling);
  });

  // Remove tile-grid fill (decorative, not meaningful in PPTX)
  svgEl.querySelectorAll('[fill="url(#gridp)"]').forEach((el) => {
    el.setAttribute("fill", "none");
    el.removeAttribute("opacity");
  });

  // Remove unused defs (markers, patterns)
  svgEl.querySelectorAll("marker, pattern").forEach((n) => n.remove());
  svgEl.querySelectorAll("defs").forEach((d) => { if (!d.hasChildNodes()) d.remove(); });
}

// ─── Build one page SVG ────────────────────────────────────────────────────────
// Composes three nested <svg> viewports (header / content / footer) stacked
// vertically inside an outer SVG that has the display pixel dimensions — so
// PowerPoint's "Convert to Shape" maps font-size user-units to the correct pt.
function buildPageSvg(
  inner,           // cleaned inner SVG content (no outer <svg> wrapper)
  bgColor,         // diagram background colour
  svgW, svgH,
  topPad,
  footerH, footerAbsY,
  contentAbsStart,
  contentRelStart, contentRelEnd,
  isFirstPage,
  displayW_px, displayH_px,
) {
  const absContentStart = contentAbsStart + contentRelStart;
  const absContentEnd   = Math.min(contentAbsStart + contentRelEnd, footerAbsY);
  const contentSvgH     = Math.max(1, absContentEnd - absContentStart);

  // Page 1 shows title area + header; later pages show header only
  const hdrViewY = isFirstPage ? 0 : topPad;
  const hdrViewH = isFirstPage ? topPad + HEADER_SECTION_H : HEADER_SECTION_H;
  const totalH   = hdrViewH + contentSvgH + footerH;

  let contentY = hdrViewH;   // y offset in outer coordinate space
  let footerY  = contentY + contentSvgH;

  const ns  = `xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`;
  const bg  = `<rect width="${svgW}" height="${totalH}" fill="${bgColor}"/>`;

  const hdrVP = `<svg x="0" y="0" width="${svgW}" height="${hdrViewH}" ` +
    `viewBox="0 ${hdrViewY} ${svgW} ${hdrViewH}">${inner}</svg>`;

  const contentVP = `<svg x="0" y="${contentY}" width="${svgW}" height="${contentSvgH}" ` +
    `viewBox="0 ${absContentStart} ${svgW} ${contentSvgH}">${inner}</svg>`;

  const footerVP = footerH > 0
    ? `<svg x="0" y="${footerY}" width="${svgW}" height="${footerH}" ` +
      `viewBox="0 ${footerAbsY} ${svgW} ${footerH}">${inner}</svg>`
    : "";

  // Outer SVG: viewBox in original coordinate units, width/height in display pixels.
  // This makes 1 SVG user-unit = (displayW_px / svgW) pixels — exactly the visual
  // scale — so font-size values convert to the right pt size in PowerPoint shapes.
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg ${ns} width="${displayW_px}" height="${displayH_px}" ` +
    `viewBox="0 0 ${svgW} ${totalH}">\n` +
    bg + "\n" + hdrVP + "\n" + contentVP + "\n" + footerVP + "\n</svg>"
  );
}

function toDataUri(svgStr) {
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function downloadPPTX(
  title,
  src,
  {
    themeBg               = "#ffffff",
    includeStepBlockCaptions = true,
    slideWidthIn          = 13.33,
    slideHeightIn         = 7.5,
    marginIn              = 0.25,
  } = {}
) {
  const model = parseDSL(src || "");
  const theme = Object.values(THEMES).find((t) => t.bg === themeBg) ?? THEMES.basic;

  // Render headlessly without gutters — predictable row heights that exactly
  // match our stepRowH() calculation above (no gutter-text extra-height).
  const svgStr = renderDiagramSvg({
    model,
    theme,
    showLeftGutter:        false,
    showRightGutter:       false,
    showStepBlockCaptions: includeStepBlockCaptions,
  });

  // Parse, clean, extract dimensions and background colour
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgStr, "image/svg+xml");
  const svgEl  = svgDoc.documentElement;

  cleanSvgEl(svgEl);
  svgEl.setAttribute("xmlns",       "http://www.w3.org/2000/svg");
  svgEl.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

  const [, , svgW, svgH] = (svgEl.getAttribute("viewBox") || "0 0 800 600")
    .split(" ").map(Number);
  const style     = svgEl.getAttribute("style") || "";
  const bgMatch   = style.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/i);
  const bgColor   = bgMatch ? bgMatch[1] : (theme.bg || "#ffffff");

  // Serialise inner content only (we wrap it ourselves per page)
  const openEnd     = svgStr.indexOf(">", svgStr.indexOf("<svg"));
  const closeStart  = svgStr.lastIndexOf("</svg>");
  const innerContent = svgStr.slice(openEnd + 1, closeStart);

  // Compute page slices
  const { slices, topPad, footerH, footerAbsY, contentAbsStart, scale } =
    computeSlices(model, svgW, svgH, slideWidthIn, slideHeightIn, marginIn);

  const contentW_in = slideWidthIn  - 2 * marginIn;
  const contentH_in = slideHeightIn - 2 * marginIn;
  const displayW_px = Math.round(contentW_in * 96);

  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";

  for (let i = 0; i < slices.length; i++) {
    const { contentRelStart, contentRelEnd } = slices[i];
    const isFirst = i === 0;

    const hdrViewH    = isFirst ? topPad + HEADER_SECTION_H : HEADER_SECTION_H;
    const absStart    = contentAbsStart + contentRelStart;
    const absEnd      = Math.min(contentAbsStart + contentRelEnd, footerAbsY);
    const contentSvgH = Math.max(1, absEnd - absStart);
    const totalSvgH   = hdrViewH + contentSvgH + footerH;

    // Display pixel height keeps the correct aspect ratio
    const displayH_px = Math.round(displayW_px * (totalSvgH / svgW));

    const pageSvg = buildPageSvg(
      innerContent, bgColor,
      svgW, svgH,
      topPad,
      footerH, footerAbsY,
      contentAbsStart,
      contentRelStart, contentRelEnd,
      isFirst,
      displayW_px, displayH_px,
    );

    // Image dimensions in inches
    const imgW_in = contentW_in;
    const imgH_in = imgW_in * (totalSvgH / svgW);
    const finalH  = Math.min(imgH_in, contentH_in);
    const finalW  = finalH < imgH_in ? finalH * (svgW / totalSvgH) : imgW_in;

    const slide = pptx.addSlide();
    slide.addImage({
      data: toDataUri(pageSvg),
      x: marginIn + (contentW_in - finalW) / 2,
      y: marginIn + (contentH_in - finalH) / 2,
      w: finalW,
      h: finalH,
    });
  }

  const blob = await pptx.write({ outputType: "blob" });
  triggerDownload(blob, `${title || "swimlane"}.pptx`);
}
