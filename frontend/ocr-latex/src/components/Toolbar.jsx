// src/components/Toolbar.jsx
import React, { useState } from "react";
import {
  PenTool, Eraser, Square, Circle, Minus, Trash2, Undo2, Redo2, Settings
} from "lucide-react";
import SettingsModal from "./SettingsModal";

const Toolbar = ({
  tool, setTool,
  clearCanvas, undo, redo,
  undoStack, redoStack,
  isLoading,
  historySize, setHistorySize,
  apiKey, setApiKey,
  transcribe,
  isTranscribing,
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
      <div className="flex items-center justify-between p-3 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-4">
        {/* Left: Tools + Actions */}
        <div className="flex items-center gap-1">
          {tools.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              disabled={isLoading}
              className={`relative group p-2.5 rounded-lg transition-all duration-200 ${
                tool === id
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400 ring-opacity-50"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              aria-label={label}
            >
              <Icon size={18} />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {label}
              </span>
            </button>
          ))}

          <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            onClick={clearCanvas}
            disabled={isLoading}
            className={`relative group p-2.5 rounded-lg transition-all bg-red-600 text-white hover:bg-red-700 shadow-md ${
              isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            aria-label="Clear Canvas"
          >
            <Trash2 size={18} />
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              Clear All
            </span>
          </button>

          <button
            onClick={undo}
            disabled={isLoading || !canUndo}
            className={`relative group p-2.5 rounded-lg transition-all ${
              isLoading || !canUndo
                ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
                : "bg-gray-600 text-white hover:bg-gray-700 shadow-md cursor-pointer"
            }`}
            aria-label="Undo"
          >
            <Undo2 size={18} />
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              Undo (Ctrl+Z)
            </span>
          </button>

          <button
            onClick={redo}
            disabled={isLoading || !canRedo}
            className={`relative group p-2.5 rounded-lg transition-all ${
              isLoading || !canRedo
                ? "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
                : "bg-gray-600 text-white hover:bg-gray-700 shadow-md cursor-pointer"
            }`}
            aria-label="Redo"
          >
            <Redo2 size={18} />
            <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              Redo (Ctrl+Y)
            </span>
          </button>
        </div>

        {/* Right: Transcribe + Settings */}
        <div className="flex items-center gap-2">
          <button
            onClick={transcribe}
            disabled={isTranscribing || !apiKey}
            className="px-5 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: isTranscribing ? "#6b7280" : "#3b82f6" }}
          >
            {isTranscribing ? "Processing..." : "Transcribe"}
          </button>

          <button
            onClick={() => setOpenSettings(true)}
            className="p-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
            aria-label="Open Settings"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

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