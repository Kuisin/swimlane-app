/** Map React camelCase SVG attribute names to kebab-case. */
const CAMEL_ATTRS = {
  strokeWidth: "stroke-width",
  strokeDasharray: "stroke-dasharray",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  fillOpacity: "fill-opacity",
  fillRule: "fill-rule",
  clipPath: "clip-path",
  clipRule: "clip-rule",
  textAnchor: "text-anchor",
  textDecoration: "text-decoration",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  fontStyle: "font-style",
  letterSpacing: "letter-spacing",
  vectorEffect: "vector-effect",
  markerEnd: "marker-end",
  markerStart: "marker-start",
  markerMid: "marker-mid",
  markerWidth: "marker-width",
  markerHeight: "marker-height",
};

function decodeEntities(value) {
  return value
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Normalize SVG/HTML for structural comparison between React SSR and pure renderers. */
export function normalizeMarkup(markup) {
  let s = markup
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\sxmlns="[^"]*"/g, "")
    .replace(/\sclass="[^"]*"/g, "")
    .replace(/\saria-hidden="[^"]*"/g, "")
    .replace(/\sstroke-linecap="[^"]*"/g, "")
    .replace(/\sstroke-linejoin="[^"]*"/g, "")
    .replace(/\skey="[^"]*"/g, "");

  for (const [camel, kebab] of Object.entries(CAMEL_ATTRS)) {
    s = s.replace(new RegExp(`\\s${camel}=`, "g"), ` ${kebab}=`);
  }

  s = decodeEntities(s);

  s = s.replace(/>\s*<\/(path|rect|circle|ellipse|line|polyline|polygon|title|tspan)>/gi, "/>");
  s = s.replace(/\s+\/>/g, "/>");

  s = s.replace(/<([a-zA-Z0-9:-]+)([^>]*?)(\/?)>/g, (full, tag, attrs, slash) => {
    if (full.startsWith("</")) return full;
    const pairs = [...attrs.matchAll(/\s([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]);
    if (pairs.length === 0) return full;
    pairs.sort((a, b) => a[0].localeCompare(b[0]));
    const sorted = pairs.map(([k, v]) => ` ${k}="${v}"`).join("");
    return `<${tag}${sorted}${slash ? "/>" : ">"}`;
  });

  s = s.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

  return s;
}
