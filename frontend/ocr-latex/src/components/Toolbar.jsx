// src/components/Toolbar.jsx
import React, { useState } from "react";
import {
  PenTool, Eraser, Square, Circle, Minus, Trash2, Undo2, Redo2, Palette, Settings
} from "lucide-react";
import SettingsModal from "./SettingsModal";

const Toolbar = ({
  tool, setTool,
  color, setColor,
  brushSize, setBrushSize,
  eraserSize, setEraserSize,
  clearCanvas, undo, redo,
  undoStack, redoStack,
  isLoading,
  // now passed down to modal
  historySize, setHistorySize,
  // add these so the modal can edit API key
  apiKey, setApiKey,
}) => {
  const [openSettings, setOpenSettings] = useState(false);
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
    <>
      <div className="flex flex-wrap items-center justify-center gap-1 p-2 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Tool Buttons */}
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTool(id)}
            disabled={isLoading}
            className={`relative group p-3 rounded-lg transition-all duration-200 ${
              tool === id
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400 ring-opacity-50"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
          className={`relative group p-3 rounded-lg transition-all bg-red-600 text-white hover:bg-red-700 shadow-md ${
            isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
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
          className={`relative group p-3 rounded-lg transition-all ${
            isLoading || !canUndo
              ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
              : "bg-gray-600 text-white hover:bg-gray-700 shadow-md cursor-pointer"
          }`}
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
          className={`relative group p-3 rounded-lg transition-all ${
            isLoading || !canRedo
              ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
              : "bg-gray-600 text-white hover:bg-gray-700 shadow-md cursor-pointer"
          }`}
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
            className={`w-12 h-12 p-1 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-all ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
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

        {/* Brush/Eraser size */}
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
            className={`w-32 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 ${
              isLoading ? "opacity-50" : ""
            }`}
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

        {/* NEW: Settings button */}
        <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-1" />
        <button
          onClick={() => setOpenSettings(true)}
          className="p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          aria-label="Open Settings"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Modal */}
      <SettingsModal
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        apiKey={apiKey}
        setApiKey={(k) => {
          sessionStorage.setItem("OPENAI_KEY", k || "");
          setApiKey(k);
        }}
        historySize={historySize}
        setHistorySize={setHistorySize}
      />
    </>
  );
};

export default Toolbar;
