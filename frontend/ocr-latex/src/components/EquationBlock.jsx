// src/components/EquationBlock.jsx
import React, { useCallback, useRef, useEffect, useState, useMemo } from "react";
import { MathJax } from "better-react-mathjax";
import { Copy, Check, Download, FileCode, Trash2 } from "lucide-react";

/* ---------- tiny utils ---------- */
const safeName = (s) =>
  (s || "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9,;_=^{}[\]()+-]/gi, "")
    .slice(0, 80) || "equation";

const svgToXML = (svgEl) => {
  const svg = svgEl.cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(svg);
};

async function svgXMLToPNG(xml, { targetWidthPx, scale = 4 } = {}) {
  const vb = xml.match(/viewBox="([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)"/);
  let w = 0, h = 0;
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
    w = 1024; h = 256;
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
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(img, 0, 0, outW, outH);
  return canvas.toDataURL("image/png");
}

export default function EquationBlock({
  id,
  index,
  tex,
  active,
  selected,
  onSelect,          // activate block
  onToggleSelect,    // toggle selection (Shift + click only)
  onClearSelection,  // clear all selection (normal click)
  onDelete,
}) {
  const cardRef = useRef(null);
  const content = (tex || "").trim() || "(enter text)";

  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [tex]);

  const getSvgXML = useCallback(async () => {
    const root = cardRef.current;
    const live = root?.querySelector("mjx-container svg");
    if (live) return svgToXML(live);

    const MJ = window.MathJax;
    if (!MJ) throw new Error("MathJax not found.");
    if (MJ.startup?.promise) await MJ.startup.promise.catch(() => {});

    if (typeof MJ.tex2svgPromise === "function") {
      const doc = await MJ.tex2svgPromise(`\\[ ${content} \\]`, { display: true });
      const svg = doc?.querySelector("svg");
      if (svg) return svgToXML(svg);
    }
    if (typeof MJ.tex2svg === "function") {
      const doc = MJ.tex2svg(`\\[ ${content} \\]`, { display: true });
      const svg = doc?.querySelector("svg");
      if (svg) return svgToXML(svg);
    }
    throw new Error("Unable to obtain SVG.");
  }, [content]);

  const onCopyPNG = useCallback(async () => {
    try {
      const xml = await getSvgXML();
      const dataURL = await svgXMLToPNG(xml, { targetWidthPx: 1600 });
      const resp = await fetch(dataURL);
      const blob = await resp.blob();

      if (!("clipboard" in navigator) || typeof ClipboardItem === "undefined") {
        return alert("Clipboard images not supported in this browser.");
      }

      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
    } catch (e) {
      console.error(e);
      alert("Copy failed: " + e.message);
    }
  }, [getSvgXML]);

   const onExportPNG = useCallback(async () => {
    try {
      const xml = await getSvgXML();
      const dataURL = await svgXMLToPNG(xml, { targetWidthPx: 1600 });
      const a = document.createElement("a");
      a.download = `${safeName(content)}.png`;
      a.href = dataURL;
      a.click();
    } catch (e) {
      console.error(e);
      alert("PNG export failed: " + e.message);
    }
  }, [getSvgXML, content]);

  const onExportSVG = useCallback(async () => {
    try {
      const xml = await getSvgXML();
      const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `${safeName(content)}.svg`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("SVG export failed: " + e.message);
    }
  }, [getSvgXML, content]);

  const layoutId = useMemo(() => `eq-${id}`, [id]);

  // === CLICK HANDLER: Shift + click = toggle, normal = activate + clear ===
  const handleClick = (e) => {
    e.stopPropagation();

    if (e.shiftKey) {
      // Shift + click → toggle selection of THIS block only
      onToggleSelect();
      return;
    }

    // Normal click → activate + clear all selection
    onSelect();
    onClearSelection();
  };

  return (
    <div
      ref={cardRef}
      id={`eq-${index}`}
      className={[
        "group relative rounded-xl border p-4 my-4 cursor-pointer transition",
        "bg-gray-50 dark:bg-gray-900",
        "border-gray-200 dark:border-gray-700",
        active ? "ring-2 ring-blue-500 border-blue-400" : "hover:border-blue-300",
        selected ? "ring-2 ring-green-500" : "",
      ].join(" ")}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect();
          onClearSelection();
        }
      }}
      aria-pressed={active}
      aria-label={`Equation block ${index + 1}${active ? " (active)" : ""}`}
    >
      {/* Action Buttons */}
      <div
        className={`
          absolute right-3 top-3 flex gap-2 transition-opacity duration-200
          ${active
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          }
        `}
      >
        <button onClick={(e) => { e.stopPropagation(); onCopyPNG(); }} disabled={copied}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition ${
            copied
              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-default"
              : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title={copied ? "Copied!" : "Copy PNG to clipboard"}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onExportPNG(); }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Download as PNG">
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PNG</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onExportSVG(); }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Download as SVG">
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SVG</span>
        </button>

        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
          title="Delete this block">
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      {/* MathJax */}
      <div className="w-full flex items-center justify-center" style={{ minHeight: "6rem" }}>
        <MathJax dynamic hideUntilTypeset="first" renderMode="post" layoutId={layoutId} layout="position">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
            <span style={{ display: "inline-block" }}>{content}</span>
          </div>
        </MathJax>
      </div>
    </div>
  );
}