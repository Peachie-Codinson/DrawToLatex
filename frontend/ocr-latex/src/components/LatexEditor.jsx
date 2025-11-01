// src/components/LatexEditor.jsx
import React, { useEffect, useState } from "react";

const LatexEditor = ({ latex, setLatex, hasActive }) => {
  const [copied, setCopied] = useState(false);

  // Reset the button when incoming latex or active block changes
  useEffect(() => {
    setCopied(false);
  }, [latex, hasActive]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(latex || "");
      setCopied(true);
    } catch (e) {
      console.error(e);
      // Optional: brief failure flash
      setCopied(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-3 text-center text-gray-800 dark:text-gray-100">
        Editable LaTeX {hasActive ? "" : "(No active block)"}
      </h3>

      <div className="relative">
        <textarea
          value={latex}
          onChange={(e) => {
            // User editing should also reset “Copied!”
            if (copied) setCopied(false);
            setLatex(e.target.value);
          }}
          placeholder="Paste or edit LaTeX here..."
          className="w-full h-32 p-4 pr-28 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          style={{ backgroundColor: "#ffffff", borderColor: "#d1d5db", color: "#1f2937" }}
          disabled={!hasActive}
          aria-label="LaTeX editor"
        />

        <button
          onClick={onCopy}
          disabled={!hasActive || copied}
          className={[
            "absolute top-2 right-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            "text-white",
            copied
              ? "bg-gray-400 cursor-default"
              : "bg-green-600 hover:bg-green-700",
            !hasActive ? "opacity-60 cursor-not-allowed" : ""
          ].join(" ")}
          aria-live="polite"
          aria-label={copied ? "Copied!" : "Copy LaTeX"}
          title={copied ? "Copied!" : "Copy LaTeX"}
        >
          {copied ? "Copied!" : "Copy LaTeX"}
        </button>
      </div>
    </div>
  );
};

export default LatexEditor;
