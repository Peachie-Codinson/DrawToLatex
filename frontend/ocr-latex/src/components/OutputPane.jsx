// src/components/OutputPane.jsx
import React, { useState, useEffect } from "react";
import EquationBlock from "./EquationBlock";
import { Reorder } from "framer-motion";

export default function OutputPane({
  blocks = [],
  activeId = null,
  setActive = () => {},
  addBlock = () => {},
  deleteBlock = () => {},
  updateBlocksOrder = () => {}, // called with the new array
}) {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    const n = parseInt(saved || "18", 10);
    return Number.isFinite(n) ? n : 18;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  // sync theme / fontSize with localStorage
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  const handleReorder = (newOrder) => {
    updateBlocksOrder(newOrder); // <-- push new order straight to App
  };

  return (
    <div className="p-6 flex flex-col h-full min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Rendered Equations
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => addBlock("")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            + New Equation
          </button>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Font:</span>
            <input
              type="range"
              min={14}
              max={48}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
            />
            <span className="w-10 text-center font-mono text-xs">{fontSize}px</span>
          </label>

          <button
            onClick={() => setIsDark((d) => !d)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
          >
            {isDark ? "Sun" : "Moon"}
          </button>
        </div>
      </div>

      {/* Reorderable list */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm"
        style={{ fontSize: `${fontSize}px`, scrollbarGutter: "stable" }}
      >
        {blocks.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 italic py-8">
            No equations yet. Click “+ New Equation” to start.
          </div>
        ) : (
          <Reorder.Group axis="y" values={blocks} onReorder={handleReorder} className="space-y-4">
            {blocks.map((b, i) => (
              <Reorder.Item
                key={b.id}
                value={b}
                whileDrag={{
                  scale: 1.03,
                  boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
                  zIndex: 10,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                layout="position"
              >
                <EquationBlock
                  id={b.id}
                  index={i}
                  tex={b.tex ?? ""}
                  active={b.id === activeId}
                  onSelect={() => setActive(b.id)}
                  onDelete={() => deleteBlock(b.id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}