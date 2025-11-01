// src/components/LatexEditor.jsx

import React from "react";

const LatexEditor = ({ latex, setLatex }) => {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-3 text-center text-gray-800 dark:text-gray-100">
        Editable LaTeX
      </h3>
      <textarea
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        placeholder="Paste or edit LaTeX here..."
        className="w-full h-32 p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#d1d5db",
          color: "#1f2937",
        }}
      />
      <button
        onClick={() => navigator.clipboard.writeText(latex)}
        className="mt-3 w-full py-2.5 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
      >
        Copy LaTeX
      </button>
    </div>
  );
};

export default LatexEditor;