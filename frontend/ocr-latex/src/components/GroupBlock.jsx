// src/components/GroupBlock.jsx
import React from "react";
import { MathJax } from "better-react-mathjax";
import { Trash2, SplitSquareVertical } from "lucide-react";

const alignMap = {
  left: { open: "\\(", close: "\\)", env: null },
  center: { open: "\\[", close: "\\]", env: null },
  align: { open: "\\begin{align}", close: "\\end{align}", env: "align" },
};

export default function GroupBlock({
  group,
  isSelected,
  onToggleSelect,
  onSplit,
  onChangeAlign,
  activeId,
  setActive,
  deleteBlock,
}) {
  const { children, align = "center" } = group;
  const cfg = alignMap[align];

  // Build LaTeX source for the whole group
  const groupTex = children
    .map((c) => c.tex?.trim() || "")
    .filter(Boolean)
    .join(cfg.env ? " \\\\\n" : "\n");

  const fullTex =
    cfg.env ? `${cfg.open}\n${groupTex}\n${cfg.close}` : `${cfg.open}${groupTex}${cfg.close}`;

  return (
    <div
      onClick={onToggleSelect}
      className={`group relative rounded-xl border p-4 my-4 cursor-pointer transition
        ${isSelected ? "ring-2 ring-green-500 border-green-400" : "border-gray-300 dark:border-gray-600"}
        bg-gray-50 dark:bg-gray-900 hover:border-blue-300`}
    >
      {/* Group toolbar – appears on hover or when selected */}
      <div
        className={`absolute right-3 top-3 flex gap-1 transition-opacity
          ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        {/* Align buttons */}
        {["left", "center", "align"].map((a) => (
          <button
            key={a}
            onClick={(e) => {
              e.stopPropagation();
              onChangeAlign(a);
            }}
            className={`px-2 py-0.5 text-xs rounded border capitalize
              ${align === a
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
          >
            {a === "align" ? "=" : a}
          </button>
        ))}

        {/* Split */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSplit();
          }}
          className="p-1 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Split group"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
        </button>

        {/* Delete whole group */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            children.forEach((c) => deleteBlock(c.id));
            deleteBlock(group.id);
          }}
          className="p-1 rounded bg-red-600 text-white hover:bg-red-700"
          title="Delete group"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Rendered group */}
      <MathJax dynamic hideUntilTypeset="every">
        <div className="flex justify-center w-full py-2">
          <div>{fullTex}</div>
        </div>
      </MathJax>

      {/* Visual cue for children */}
      <div className="mt-2 flex flex-wrap gap-1 justify-center">
        {children.map((c, i) => (
          <span
            key={c.id}
            onClick={(e) => {
              e.stopPropagation();
              setActive(c.id);
            }}
            className={`text-xs px-2 py-0.5 rounded border cursor-pointer
              ${activeId === c.id ? "bg-blue-100 border-blue-500" : "border-gray-300"}`}
          >
            #{i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}