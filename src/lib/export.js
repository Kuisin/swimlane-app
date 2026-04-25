export function getSerializedSVG() {
  const svg = document.getElementById("swimlane-svg");
  if (!svg) return null;
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  const vb = (svg.getAttribute("viewBox") || "0 0 800 600")
    .split(" ")
    .map(Number);
  const w = vb[2],
    h = vb[3];
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const str =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(clone);
  return { str, w, h };
}

function triggerDownload(blob, filename) {
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

export function downloadSVG(title) {
  const data = getSerializedSVG();
  if (!data) return;
  const blob = new Blob([data.str], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${title || "swimlane"}.svg`);
}

export function downloadPNG(title, bgColor) {
  const data = getSerializedSVG();
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
