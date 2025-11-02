import React, { useCallback, useRef, useEffect, useState, useMemo } from "react";
import { MathJax } from "better-react-mathjax";
import { Copy, Check, Download, FileCode, Trash2 } from "lucide-react";

/* ---------- tiny utils (copied from EquationBlock) ---------- */
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

/* Convert SVG XML to PNG dataURL (transparent bg) */
async function svgXMLToPNG(xml, { targetWidthPx, scale = 4 } = {}) {
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
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(img, 0, 0, outW, outH);
  return canvas.toDataURL("image/png");
}

/* ------------------------------------------------------------------ */
export default function GroupBlock({
  group,
  active,
  selected,
  onSelect,
  onToggleSelect,
  onDelete,
}) {
  const { alignment, members } = group;
  const cardRef = useRef(null);

  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [group]);

  /* ------------------- LaTeX wrapper ------------------- */
  const wrapper = useMemo(() => {
  const texes = members.map((m) => m.tex?.trim() || "(empty)").filter(Boolean);

  let innerContent = "";

  if (alignment === "left") {
    innerContent = `\\begin{array}{l} ${texes.join(" \\\\ ")} \\end{array}`;
  } else if (alignment === "center") {
    innerContent = `\\begin{array}{c} ${texes.join(" \\\\ ")} \\end{array}`;
  } else {
    // alignment === "align"
    const alignedLines = texes.map((line) => {
      const parts = line.split("=");
      if (parts.length < 2) return line;
      return `${parts[0].trim()} &= ${parts.slice(1).join("=").trim()}`;
    });
    innerContent = alignedLines.join(" \\\\ ");
  }

  let finalLatex = "";

  if (alignment === "align") {
    // Wrap align* safely — never strip inside
    finalLatex = `\\begin{align*} ${innerContent} \\end{align*}`;
  } else {
    // For left/center: optionally wrap in parentheses/brackets, but we want NONE
    // So just return the array content directly
    finalLatex = innerContent;
  }

  // Final: wrap in display math (MathJax handles sizing)
  return `\\[${finalLatex}\\]`;
}, [alignment, members]);

  /* ------------------- SVG extraction ------------------- */
  const getSvgXML = useCallback(async () => {
    const root = cardRef.current;
    const live = root?.querySelector("mjx-container svg");
    if (live) return svgToXML(live);

    const MJ = window.MathJax;
    if (!MJ) throw new Error("MathJax not found.");

    if (MJ.startup?.promise) await MJ.startup.promise.catch(() => {});

    if (typeof MJ.tex2svgPromise === "function") {
      const doc = await MJ.tex2svgPromise(`\\[ ${wrapper} \\]`, { display: true });
      const svg = doc?.querySelector("svg");
      if (svg) return svgToXML(svg);
    }

    if (typeof MJ.tex2svg === "function") {
      const doc = MJ.tex2svg(`\\[ ${wrapper} \\]`, { display: true });
      const svg = doc?.querySelector("svg");
      if (svg) return svgToXML(svg);
    }

    throw new Error("Unable to obtain SVG.");
  }, [wrapper]);

  /* ------------------- Export actions ------------------- */
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
      a.download = `${safeName(members.map((m) => m.tex).join("_"))}.png`;
      a.href = dataURL;
      a.click();
    } catch (e) {
      console.error(e);
      alert("PNG export failed: " + e.message);
    }
  }, [getSvgXML, members]);

  const onExportSVG = useCallback(async () => {
    try {
      const xml = await getSvgXML();
      const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `${safeName(members.map((m) => m.tex).join("_"))}.svg`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("SVG export failed: " + e.message);
    }
  }, [getSvgXML, members]);

  /* ------------------- UI ------------------- */
  return (
    <div
      ref={cardRef}
      className={[
        "group relative rounded-xl border p-4 my-4 cursor-pointer transition",
        "bg-gray-50 dark:bg-gray-900",
        "border-gray-200 dark:border-gray-700",
        active ? "ring-2 ring-blue-500 border-blue-400" : "hover:border-blue-300",
        selected ? "ring-2 ring-green-500" : "",
      ].join(" ")}
      onClick={(e) => {
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          e.stopPropagation();
          onToggleSelect();
        } else {
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Selection checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
        onClick={(e) => e.stopPropagation()}
        className="absolute left-3 top-3 w-4 h-4 rounded border-gray-400 dark:border-gray-600 cursor-pointer"
      />

      {/* Action buttons (same layout as EquationBlock) */}
      <div
        className={`
          absolute right-3 top-3 flex gap-2 transition-opacity duration-200
          ${active
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          }
        `}
      >
        {/* Copy PNG */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopyPNG();
          }}
          disabled={copied}
          className={`
            flex items-center gap-1 text-xs px-2 py-1 rounded border transition
            ${copied
              ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-default"
              : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }
          `}
          title={copied ? "Copied!" : "Copy PNG to clipboard"}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
        </button>

        {/* Download PNG */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExportPNG();
          }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Download as PNG"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PNG</span>
        </button>

        {/* Download SVG */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExportSVG();
          }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Download as SVG"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SVG</span>
        </button>

        {/* Delete whole group */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
          title="Delete group"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      {/* Rendered LaTeX */}
      <div className="w-full flex items-center justify-center" style={{ minHeight: "6rem" }}>
        <MathJax dynamic hideUntilTypeset="first">
          {wrapper}
        </MathJax>
      </div>
    </div>
  );
}