import React, { useState, useEffect } from "react";
import EquationBlock from "./EquationBlock";

export default function OutputPane({
  blocks = [],
  activeId = null,
  setActive = () => {},
  addBlock = () => {},
  deleteBlock = () => {},
}) {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    const n = parseInt(saved || "18", 10);
    return Number.isFinite(n) ? n : 18;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  const list = Array.isArray(blocks) ? blocks : [];

  return (
    <div className="p-6 flex flex-col h-full min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Rendered Equations
        </h3>
        <div className="flex items-center gap-4">
          {/* Add Block Button */}
          <button
            onClick={() => addBlock("")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
            title="Add a new equation block"
          >
            + New Equation
          </button>

          {/* Font Size Slider */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Font:</span>
            <input
              type="range"
              min={14}
              max={48}
              value={fontSize}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setFontSize(Number.isFinite(n) ? n : 18);
              }}
              className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 transition-all duration-200 custom-range"
            />
            <span className="w-10 text-center font-mono text-xs">{fontSize}px</span>
          </label>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDark((d) => !d)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
            title="Toggle theme"
          >
            {isDark ? <span className="text-lg">☀️</span> : <span className="text-lg">🌙</span>}
          </button>
        </div>
      </div>

      {/* Equation Blocks List */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200"
        style={{ fontSize: `${fontSize}px`, scrollbarGutter: "stable" }}
      >
        {list.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 italic py-8">
            No equations yet. Click “+ New Equation” to start.
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((b, i) => (
              <div
                key={b.id ?? i}
                className="transition-opacity duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <EquationBlock
                  id={b.id}
                  index={i}
                  tex={b.tex ?? ""}
                  active={b.id === activeId}
                  onSelect={() => setActive(b.id)}
                  onDelete={() => deleteBlock(b.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}