import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Toolbar from "./Toolbar";

const ERASER_FACTOR = 1.5;

const CanvasBoard = ({
  apiKey,
  setApiKey,
  setLatex,
  isLoading,
  setIsLoading,
}) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(Math.ceil(4 * ERASER_FACTOR));

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [historySize, setHistorySize] = useState(20);

  /* --------------------------------------------------------------- */
  /*  History                                                        */
  /* --------------------------------------------------------------- */
  const pushState = useCallback(() => {
    const dataUrl = canvasRef.current.toDataURL();
    setUndoStack((prev) => {
      const limit = Math.max(1, historySize) + 1;
      const next = [...prev, dataUrl];
      return next.slice(-limit);
    });
    setRedoStack([]);
  }, [historySize]);

  useEffect(() => {
    setUndoStack((prev) => {
      const limit = Math.max(1, historySize) + 1;
      return prev.slice(-limit);
    });
    setRedoStack((prev) => {
      const limit = Math.max(0, historySize);
      return prev.slice(-limit);
    });
  }, [historySize]);

  const restore = useCallback((dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => ctxRef.current.drawImage(img, 0, 0);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length <= 1) return;
    setUndoStack((prev) => {
      const copy = [...prev];
      const popped = copy.pop();
      setRedoStack((r) => {
        const limit = Math.max(0, historySize);
        const next = [...r, popped].slice(-limit);
        return next;
      });
      const last = copy[copy.length - 1];
      restore(last);
      return copy;
    });
  }, [undoStack.length, restore, historySize]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    setRedoStack((prev) => {
      const copy = [...prev];
      const nextState = copy.pop();
      setUndoStack((u) => {
        const limit = Math.max(1, historySize) + 1;
        const next = [...u, nextState].slice(-limit);
        return next;
      });
      restore(nextState);
      return copy;
    });
  }, [redoStack.length, restore, historySize]);

  const clearCanvas = useCallback(() => {
    const ctx = ctxRef.current;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    pushState();
  }, [pushState]);

  /* --------------------------------------------------------------- */
  /*  Canvas init                                                    */
  /* --------------------------------------------------------------- */
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
    pushState();
  }, [pushState]);

  useEffect(() => initCanvas(), [initCanvas]);

  /* --------------------------------------------------------------- */
  /*  Update line style                                              */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    const ctx = ctxRef.current;
    const size = tool === "eraser" ? eraserSize : brushSize;
    ctx.lineWidth = size;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
  }, [brushSize, eraserSize, color, tool]);

  /* --------------------------------------------------------------- */
  /*  Keyboard shortcuts                                             */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      const tag = (t?.tagName || "").toUpperCase();
      const isEditable =
        t?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";

      if (isEditable) return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  /* --------------------------------------------------------------- */
  /*  Mouse coordinate scaling                                       */
  /* --------------------------------------------------------------- */
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoords(e);
    setStartPos({ x, y });
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = ctxRef.current;

    if (tool === "brush" || tool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();
      return;
    }

    const snapshot = undoStack[undoStack.length - 1];
    const img = new Image();
    img.src = snapshot;
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;

      if (tool === "rect")
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      else if (tool === "circle") {
        const r = Math.hypot(x - startPos.x, y - startPos.y);
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    };
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    ctxRef.current.closePath();
    setIsDrawing(false);
    pushState();
  };

  /* --------------------------------------------------------------- */
  /*  Custom cursor                                                  */
  /* --------------------------------------------------------------- */
  const cursorSvg = useMemo(() => {
    const size = tool === "eraser" ? eraserSize : brushSize;
    const col = tool === "eraser" ? "#ffffff" : color;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}"><circle cx="${size}" cy="${size}" r="${size - 1}" fill="${col}" stroke="#00000030"/></svg>`;
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${size} ${size}, auto`;
  }, [brushSize, eraserSize, color, tool]);

  /* --------------------------------------------------------------- */
  /*  OCR Transcription                                              */
  /* --------------------------------------------------------------- */
  const transcribe = async () => {
    if (!apiKey) return alert("Please enter your API key");
    sessionStorage.setItem("OPENAI_KEY", apiKey);
    setIsLoading(true);

    const blob = await new Promise((resolve) =>
      canvasRef.current.toBlob(resolve, "image/png")
    );
    const form = new FormData();
    form.append("image", blob);

    try {
      const res = await fetch("https://drawtolatex.onrender.com/ocr", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      const data = await res.json();
      setLatex(data.latex || data.detail || "Error");
    } catch {
      setLatex("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-gray-100">
        TeX Canvas
      </h2>

      {/* Toolbar with left-aligned tools and right-aligned actions */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        eraserSize={eraserSize}
        setEraserSize={setEraserSize}
        clearCanvas={clearCanvas}
        undo={undo}
        redo={redo}
        undoStack={undoStack}
        redoStack={redoStack}
        isLoading={isLoading}
        historySize={historySize}
        setHistorySize={setHistorySize}
        apiKey={apiKey}
        setApiKey={setApiKey}
        transcribe={transcribe}
        isTranscribing={isLoading}
      />

      {/* Canvas with top-left controls */}
      <div className="relative flex-1 mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        {/* Top-left: Color + Size */}
        <div className="absolute top-6 left-6 flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md z-10 border border-gray-200 dark:border-gray-600">
          <label className="relative group">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isLoading}
              className={`w-9 h-9 rounded-full appearance-none cursor-pointer border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-all duration-200 ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-blue-500"
              }`}
              style={{ background: "transparent" }}
              aria-label="Select brush color"
            />
            <span
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ backgroundColor: color }}
            />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Brush Color
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="30"
              value={tool === "eraser" ? eraserSize : brushSize}
              onChange={(e) => {
                const v = +e.target.value;
                if (tool === "eraser") setEraserSize(v);
                else setBrushSize(v);
              }}
              disabled={isLoading}
              className={`w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 transition-all duration-200 custom-range ${
                isLoading ? "opacity-50" : ""
              }`}
              aria-label={tool === "eraser" ? "Eraser size" : "Brush size"}
            />
            <span className="w-8 text-center text-xs font-mono text-gray-700 dark:text-gray-300">
              {tool === "eraser" ? eraserSize : brushSize}px
            </span>
          </label>
        </div>

        {/* Canvas */}
        <div className="absolute inset-4 overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white">
          <canvas
            ref={canvasRef}
            width={600}
            height={360}
            className="w-full h-auto block"
            style={{
              backgroundColor: "#ffffff",
              cursor: tool === "eraser" ? "crosshair" : cursorSvg,
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};

export default CanvasBoard;