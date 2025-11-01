// src/components/Toolbar.jsx
import React from "react";
import {
  PenTool,
  Eraser,
  Square,
  Circle,
  Minus,
  Trash2,
  Undo2,
  Redo2,
  Palette,
} from "lucide-react";

const Toolbar = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  eraserSize,
  setEraserSize,
  clearCanvas,
  undo,
  redo,
  undoStack,
  redoStack,
  isLoading,
  // NEW props
  historySize,
  setHistorySize,
}) => {
  const tools = [
    { id: "brush", icon: PenTool, label: "Brush" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "line", icon: Minus, label: "Line" },
  ];

  const canUndo = undoStack.length > 1;
  const canRedo = redoStack.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1 p-2 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Tool Buttons */}
      {tools.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTool(id)}
          disabled={isLoading}
          className={`
            relative group p-3 rounded-lg transition-all duration-200
            ${tool === id
              ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400 ring-opacity-50"
              : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }
            ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          aria-label={label}
        >
          <Icon size={20} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {label}
          </span>
        </button>
      ))}

      <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Clear */}
      <button
        onClick={clearCanvas}
        disabled={isLoading}
        className={`
          relative group p-3 rounded-lg transition-all
          bg-red-600 text-white hover:bg-red-700 shadow-md
          ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-label="Clear Canvas"
      >
        <Trash2 size={20} />
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          Clear All
        </span>
      </button>

      {/* Undo */}
      <button
        onClick={undo}
        disabled={isLoading || !canUndo}
        className={`
          relative group p-3 rounded-lg transition-all
          ${isLoading || !canUndo
            ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
            : "bg-gray-600 text-white hover:bg-gray-700 shadow-md cursor-pointer"
          }
        `}
        aria-label="Undo"
      >
        <Undo2 size={20} />
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          Undo (Ctrl+Z)
        </span>
      </button>

      {/* Redo */}
      <button
        onClick={redo}
        disabled={isLoading || !canRedo}
        className={`
          relative group p-3 rounded-lg transition-all
          ${isLoading || !canRedo
            ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
            : "bg-gray-600 text-white hover:bg-gray-700 shadow-md cursor-pointer"
          }
        `}
        aria-label="Redo"
      >
        <Redo2 size={20} />
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          Redo (Ctrl+Y)
        </span>
      </button>

      <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* Color Picker */}
      <div className="relative group">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={isLoading}
          className={`
            w-12 h-12 p-1 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600
            hover:border-blue-500 transition-all
            ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
          `}
          style={{ backgroundColor: color }}
          aria-label="Color"
        />
        <Palette
          size={18}
          className="absolute bottom-0 right-0 text-white pointer-events-none"
          style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}
        />
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          Color
        </span>
      </div>

      {/* Brush / Eraser Size Slider */}
      <div className="flex items-center gap-2 px-2">
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
          className={`
            w-32 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600
            ${isLoading ? "opacity-50" : ""}
          `}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
              ((tool === "eraser" ? eraserSize : brushSize) - 1) / 29 * 100
            }%, #d1d5db ${((tool === "eraser" ? eraserSize : brushSize) - 1) / 29 * 100}%, #d1d5db 100%)`,
          }}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-center">
          {tool === "eraser" ? eraserSize : brushSize}
        </span>
      </div>

      {/* NEW: History size control (inside toolbar) */}
      {/* NEW: History size control (inside toolbar) – STYLED */}
<div className="flex items-center gap-1.5 pl-3 border-l border-gray-300 dark:border-gray-600">
  {/* Label with icon-like feel */}
  <label
    htmlFor="history-size-input"
    className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap select-none cursor-pointer"
    title="Maximum number of undo/redo steps"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-3.5 h-3.5 mr-1 text-gray-500 dark:text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    History
  </label>

  {/* Styled number input */}
  <input
    id="history-size-input"
    type="number"
    min={1}
    max={200}
    value={historySize}
    onChange={(e) => {
      const v = parseInt(e.target.value, 10);
      setHistorySize(
        Number.isFinite(v) ? Math.max(1, Math.min(20000, v)) : 20
      );
    }}
    disabled={isLoading}
    className={`
      w-16 px-2 py-1 text-xs font-mono rounded-md border
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-gray-100
      border-gray-300 dark:border-gray-600
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      transition-all duration-150
      ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-text"}
      placeholder-gray-400 dark:placeholder-gray-500
    `}
    style={{
      // Custom scrollbar for webkit (optional polish)
      WebkitAppearance: "none",
    }}
    onFocus={(e) => e.target.select()}
    title="Undo/Redo stack size (1–200)"
    aria-label="History stack size"
  />
</div>
    </div>
  );
};

export default Toolbar;