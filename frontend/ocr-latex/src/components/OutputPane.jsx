// src/components/OutputPane.jsx
import React, { useState, useEffect } from "react";
import EquationBlock from "./EquationBlock";
import { Reorder } from "framer-motion";
import GroupModal from "./GroupModal";
import { splitIntoSingleBlocks, makeId } from "../utils/blockUtils";

export default function OutputPane({
  blocks = [],
  activeId = null,
  setActive = () => {},
  addBlock = () => {},
  deleteBlock = () => {},
  updateBlocksOrder = () => {},
  replaceBlocks = () => {},
}) {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    const n = parseInt(saved || "18", 10);
    return Number.isFinite(n) ? n : 18;
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") === "dark");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  const handleReorder = (newOrder) => updateBlocksOrder(newOrder);

  // === TOGGLE SINGLE SELECTION (Shift + click) ===
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // === CLEAR ALL SELECTION (normal click) ===
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // === GROUP ===
  const handleGroupConfirm = (groupedTex, idsToRemove) => {
    const newBlock = { id: makeId(), tex: groupedTex };
    const remaining = blocks.filter((b) => !idsToRemove.includes(b.id));
    replaceBlocks([...remaining, newBlock]);
    setSelectedIds(new Set());
    setShowGroupModal(false);
    setActive(newBlock.id);
  };

  // === SPLIT ===
  const splitSelected = () => {
    const toSplit = blocks.filter((b) => selectedIds.has(b.id));
    if (!toSplit.length) return;

    const newBlocks = toSplit.flatMap((b) => {
      const singles = splitIntoSingleBlocks(b.tex);
      return singles.map((t) => ({ id: makeId(), tex: t }));
    });

    const remaining = blocks.filter((b) => !selectedIds.has(b.id));
    replaceBlocks([...remaining, ...newBlocks]);
    setSelectedIds(new Set());
  };

  const hasSelection = selectedIds.size > 0;
  const selectedCount = selectedIds.size;

  return (
    <div className="p-6 flex flex-col h-full min-h-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Rendered Equations {hasSelection && `(${selectedCount} selected)`}
        </h3>
        <div className="flex items-center gap-3">
          {hasSelection && (
            <>
              <button
                onClick={() => setShowGroupModal(true)}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                Group
              </button>
              <button
                onClick={splitSelected}
                className="px-3 py-1.5 rounded bg-orange-600 text-white text-sm hover:bg-orange-700"
              >
                Split
              </button>
            </>
          )}

          <button
            onClick={() => addBlock("")}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700"
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
              className="w-20 h-2 rounded-full appearance-none cursor-pointer"
            />
            <span className="w-10 text-center font-mono text-xs">{fontSize}px</span>
          </label>

          <button
            onClick={() => setIsDark((d) => !d)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {isDark ? "Sun" : "Moon"}
          </button>
        </div>
      </div>

      {/* Reorderable list */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm custom-scrollbar"
        style={{ fontSize: `${fontSize}px` }}
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
                whileDrag={{ scale: 1.03, boxShadow: "0 12px 24px rgba(0,0,0,0.15)", zIndex: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                layout="position"
              >
                <EquationBlock
                  id={b.id}
                  index={i}
                  tex={b.tex ?? ""}
                  active={b.id === activeId}
                  selected={selectedIds.has(b.id)}
                  onSelect={() => setActive(b.id)}
                  onToggleSelect={() => toggleSelect(b.id)}
                  onClearSelection={clearSelection}
                  onDelete={() => deleteBlock(b.id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <GroupModal
          selectedIds={Array.from(selectedIds)}
          blocks={blocks}
          onConfirm={handleGroupConfirm}
          onCancel={() => setShowGroupModal(false)}
        />
      )}
    </div>
  );
}