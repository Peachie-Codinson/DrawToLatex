// src/components/GroupModal.jsx
import React, { useState, useMemo } from "react";
import { groupLines, extractRawLines } from "../utils/blockUtils";

export default function GroupModal({
  selectedIds,
  blocks,
  onConfirm,
  onCancel,
}) {
  const [mode, setMode] = useState("centered");

  const rawLines = useMemo(() => {
    const selected = blocks.filter((b) => selectedIds.includes(b.id));
    return selected.flatMap((b) => extractRawLines(b.tex));
  }, [blocks, selectedIds]);

  const previewTex = useMemo(() => {
    return groupLines(rawLines, mode);
  }, [rawLines, mode]);

  const handleConfirm = () => {
    onConfirm(previewTex, Array.from(selectedIds));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-4">Group Selected Equations</h3>

        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="centered" checked={mode === "centered"}
              onChange={(e) => setMode(e.target.value)} className="cursor-pointer" />
            Centered (gathered)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="aligned" checked={mode === "aligned"}
              onChange={(e) => setMode(e.target.value)} className="cursor-pointer" />
            Aligned by = (align*)
          </label>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4 font-mono text-sm overflow-auto max-h-48">
          {previewTex || "(empty)"}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {rawLines.length} equation line{rawLines.length !== 1 ? "s" : ""} will be grouped.
        </p>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
            Group
          </button>
        </div>
      </div>
    </div>
  );
}