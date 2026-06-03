const SVG_NS = "http://www.w3.org/2000/svg";

/** Parse M/L points from a simple SVG path d-string. */
function parsePathPoints(d) {
  const pts = [];
  const re = /[ML]\s*([-+]?\d+(?:\.\d+)?)\s+([-+]?\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(d)) !== null) pts.push([parseFloat(m[1]), parseFloat(m[2])]);
  return pts;
}

/**
 * Replace all `marker-end` arrowhead references with inline filled polygons so
 * the arrows render correctly when the SVG is opened in PowerPoint, Illustrator,
 * Inkscape, etc. (those tools have incomplete `<marker>` support).
 */
function inlineArrowheads(svgEl) {
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
    const f = (n) => n.toFixed(2);
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
}

/**
 * Mutate a cloned SVG element so it can be edited as individual shapes in
 * PowerPoint, Illustrator and similar tools:
 *   • Adds an explicit background <rect> (CSS `background` is ignored outside browsers)
 *   • Removes the tile-grid pattern; leaves a clean solid-color background
 *   • Replaces `marker-end` arrow refs with inline filled <polygon> elements
 *   • Keeps font-size as unitless user units (intentional — see note below)
 *   • Strips now-unused <marker> and <pattern> defs
 *
 * Font-size note: the exported SVG declares width/height in cm so that
 * 1 user unit = 0.02646 cm = 0.75 pt.  Tools that infer font sizes from the
 * coordinate scale (PowerPoint, Illustrator) therefore read `font-size="13"`
 * as 9.75 pt — exactly correct.  Converting to explicit `pt` or `px` units
 * causes a mismatch: shapes are scaled to fit the slide but absolute-unit
 * fonts are not, making small text appear too large relative to its box.
 */
function prepareForExport(liveSvg, cloneSvg) {
  // Explicit background rect so PowerPoint/Illustrator shows the right fill.
  const style = liveSvg.getAttribute("style") || "";
  const colorMatch = style.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\s*\([^)]+\))/i);
  const bg = colorMatch ? colorMatch[1] : (liveSvg.style.backgroundColor || "#ffffff");
  const [, , w, h] = (liveSvg.getAttribute("viewBox") || "0 0 800 600").split(" ").map(Number);
  const bgRect = document.createElementNS(SVG_NS, "rect");
  bgRect.setAttribute("width", w);
  bgRect.setAttribute("height", h);
  bgRect.setAttribute("fill", bg);
  cloneSvg.insertBefore(bgRect, cloneSvg.firstChild);

  // Remove the decorative grid overlay. Must use fill="none" — removing the
  // attribute entirely would leave SVG's default fill (black) on the large rect.
  cloneSvg.querySelectorAll('[fill="url(#gridp)"]').forEach((el) => {
    el.setAttribute("fill", "none");
    el.removeAttribute("opacity");
  });

  // Inline arrowheads as <polygon> elements.
  inlineArrowheads(cloneSvg);

  // Convert every unitless font-size to an explicit whole-number pt value.
  // 1 SVG user unit = 0.75pt at 96dpi with our cm coordinate scale.
  // PowerPoint rounds fractional pt values (e.g. 9.75pt → 10pt), which makes
  // text appear slightly larger. Writing pre-rounded integers removes that step.
  cloneSvg.querySelectorAll("[font-size]").forEach((el) => {
    const fs = el.getAttribute("font-size");
    if (fs && /^\d+(\.\d+)?$/.test(fs)) {
      const pt = Math.max(1, Math.round(parseFloat(fs) * 0.75));
      el.setAttribute("font-size", `${pt}pt`);
    }
  });

  // Strip width/height from the inline style — CSS `width:100%` overrides the
  // explicit `width="Ncm"` attribute we set below, causing every tool to scale
  // the SVG relative to its own container rather than at the declared physical size.
  const inlineStyle = cloneSvg.getAttribute("style") || "";
  const strippedStyle = inlineStyle
    .replace(/\b(width|height)\s*:[^;]*(;|$)/gi, "")
    .replace(/^\s*;+|;\s*$/g, "")
    .replace(/;{2,}/g, ";")
    .trim();
  if (strippedStyle) cloneSvg.setAttribute("style", strippedStyle);
  else cloneSvg.removeAttribute("style");

  // Remove <marker> and <pattern> defs — now unused.
  cloneSvg.querySelectorAll("marker, pattern").forEach((n) => n.remove());
  cloneSvg.querySelectorAll("defs").forEach((d) => { if (!d.hasChildNodes()) d.remove(); });
}

export function getSerializedSVG({ includeStepBlockCaptions = true } = {}) {
  const svg = document.getElementById("swimlane-svg");
  if (!svg) return null;
  const clone = svg.cloneNode(true);
  clone.querySelectorAll("[data-export-hide]").forEach((node) => node.remove());
  if (!includeStepBlockCaptions) {
    clone.querySelectorAll("[data-export-caption]").forEach((node) => node.remove());
  }
  prepareForExport(svg, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  const vb = (svg.getAttribute("viewBox") || "0 0 800 600")
    .split(" ")
    .map(Number);
  const w = vb[2],
    h = vb[3];
  // Declare explicit dimensions in cm so PowerPoint knows the coordinate scale.
  // 1 user unit = 0.02646 cm (at 96 dpi). This locks the scale so that unitless
  // font-size values scale proportionally with shapes when "Convert to Shape" is used.
  const wcm = (w * 0.02646).toFixed(2);
  const hcm = (h * 0.02646).toFixed(2);
  clone.setAttribute("width", `${wcm}cm`);
  clone.setAttribute("height", `${hcm}cm`);
  const str =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(clone);
  return { str, w, h };
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function downloadSVG(title, { includeStepBlockCaptions = true } = {}) {
  const data = getSerializedSVG({ includeStepBlockCaptions });
  if (!data) return;
  const blob = new Blob([data.str], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${title || "swimlane"}.svg`);
}

export function downloadPNG(title, bgColor, { includeStepBlockCaptions = true } = {}) {
  const data = getSerializedSVG({ includeStepBlockCaptions });
  if (!data) return;
  const { str, w, h } = data;
  const dataUrl =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(w * scale);
    canvas.height = Math.ceil(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bgColor || "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob((b) => {
      if (!b) {
        alert("PNG生成に失敗しました (canvas tainted). SVGをご利用ください。");
        return;
      }
      triggerDownload(b, `${title || "swimlane"}.png`);
    }, "image/png");
  };
  img.onerror = (e) => {
    console.error("SVG→PNG failed", e);
    alert("PNG変換エラー。SVGをダウンロードしてください。");
  };
  img.src = dataUrl;
}
