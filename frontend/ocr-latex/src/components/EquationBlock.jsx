import React, { useCallback, useRef } from "react";
import { MathJax } from "better-react-mathjax";

/* ---------- tiny utils ---------- */
const safeName = (s) =>
  (s || "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9,;_=^{}[\]()+-]/gi, "")
    .slice(0, 80) || "equation";

/* Serialize an <svg> (no padding, no background) */
const svgToXML = (svgEl) => {
  const svg = svgEl.cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(svg);
};

/* Convert SVG XML to PNG dataURL (transparent bg), with optional target pixel width */
async function svgXMLToPNG(xml, { targetWidthPx, scale = 4 } = {}) {
  // Extract viewBox or width/height
  const vb = xml.match(/viewBox="([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/);
  let w = 0,
    h = 0;
  if (vb) {
    w = parseFloat(vb[3]);
    h = parseFloat(vb[4]);
  } else {
    const wh = xml.match(/width="([\d.]+)".*?height="([\d.]+)"/s);
    if (wh) {
      w = parseFloat(wh[1]);
      h = parseFloat(wh[2]);
    }
  }
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    w = 1024;
    h = 256;
  }

  let outW, outH;
  if (Number.isFinite(targetWidthPx) && targetWidthPx > 0) {
    const k = targetWidthPx / w;
    outW = Math.round(w * k);
    outH = Math.round(h * k);
  } else {
    outW = Math.round(w * scale);
    outH = Math.round(h * scale);
  }

  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  const img = await new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, outW, outH); // transparent
  ctx.drawImage(img, 0, 0, outW, outH);
  return canvas.toDataURL("image/png");
}

/* ---------- component ---------- */
export default function EquationBlock({ index, tex }) {
  const cardRef = useRef(null);

  // Get live SVG from MathJax
  const getSvgEl = useCallback(() => {
    const root = cardRef.current;
    const live = root?.querySelector("mjx-container svg");
    if (live) return live;

    const MJ = window?.MathJax;
    if (MJ?.tex2svg) {
      const doc = MJ.tex2svg(`\\[ ${tex} \\]`, { display: true });
      return doc?.querySelector("svg") || null;
    }
    return null;
  }, [tex]); // Fixed: tex is now in deps

  // Export as PNG
  const onExportPNG = useCallback(async () => {
    const svgEl = getSvgEl();
    if (!svgEl) return alert("SVG not ready. Try again in a moment.");

    const xml = svgToXML(svgEl);
    try {
      const dataURL = await svgXMLToPNG(xml, {
        targetWidthPx: 1600, // or use `scale: 4`
      });
      const a = document.createElement("a");
      a.download = `${safeName(tex)}.png`;
      a.href = dataURL;
      a.click();
    } catch (e) {
      console.error(e);
      alert("PNG export failed: " + e.message);
    }
  }, [getSvgEl, tex]);

  // Export as SVG
  const onExportSVG = useCallback(() => {
    const svgEl = getSvgEl();
    if (!svgEl) return alert("SVG not ready. Try again in a moment.");

    const xml = svgToXML(svgEl);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `${safeName(tex)}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, [getSvgEl, tex]);

  return (
    <div
      ref={cardRef}
      id={`eq-${index}`}
      className="relative rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900 my-4"
    >
      {/* Export Buttons */}
      <div className="absolute right-3 top-3 flex gap-2">
        <button
          onClick={onExportPNG}
          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Download as PNG"
          aria-label="Download equation as PNG"
        >
          PNG
        </button>
        <button
          onClick={onExportSVG}
          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Download as SVG"
          aria-label="Download equation as SVG"
        >
          SVG
        </button>
      </div>

      {/* Rendered Equation */}
      <MathJax dynamic hideUntilTypeset="every">
        <div className="flex justify-center items-center w-full min-h-20 py-4">
          <div>{`\\[ ${tex} \\]`}</div>
        </div>
      </MathJax>
    </div>
  );
}