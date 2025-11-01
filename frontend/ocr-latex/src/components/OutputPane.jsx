// src/components/OutputPane.jsx
import React, { useState, useEffect } from "react";
import EquationBlock from "./EquationBlock";

export default function OutputPane({ latex }) {
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

  const equations =
    (latex || "").match(/(\$\$[\s\S]*?\$\$)|(?:\\\[([\s\S]*?)\\\])/g) || [];

  return (
      <div className="p-6 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Rendered Output</h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              Font:
              <input
                type="range"
                min={14}
                max={48}
                value={fontSize}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setFontSize(Number.isFinite(n) ? n : 18);
                }}
              />
              <span>{fontSize}px</span>
            </label>
            <button
              onClick={() => setIsDark((d) => !d)}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner"
          style={{ fontSize: `${fontSize}px` }}
        >
          {equations.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 italic">
              No equations found. Use $$ $$ or \[ \] delimiters.
            </div>
          ) : (
            equations.map((eq, i) => (
              <EquationBlock
                key={i}
                index={i}
                tex={eq.replace(/^\$\$|\$\$$|\\\[|\\\]$/g, "").trim()}
              />
            ))
          )}
        </div>
      </div>
  );
}
