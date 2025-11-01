// src/components/LatexEditor.jsx
import React, { useState, useEffect, useRef } from "react";
import { Copy, Check } from "lucide-react";

const LatexEditor = ({ latex = "", setLatex, hasActive }) => {
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState(latex);

  // Sync local value when active block changes
  useEffect(() => {
    setValue(latex);
  }, [latex]);

  // Reset copied state
  useEffect(() => {
    setCopied(false);
  }, [latex, hasActive]);

  // Auto-hide "Copied!"
  useEffect(() => {
    if (copied) {
      const id = window.setTimeout(() => setCopied(false), 2000);
      return () => window.clearTimeout(id);
    }
  }, [copied]);

  
  const timeoutRef = useRef(null);

  const debouncedSetLatex = (newVal) => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setLatex(newVal);
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []); // empty deps: ref never changes

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    debouncedSetLatex(v);
  };

  const onCopy = async () => {
    if (!latex || copied || !hasActive) return;
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
    } catch {
      // ignore
    }
  };

  return (
    <div className="h-full p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="relative group flex-1 min-h-0">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={hasActive ? "Enter LaTeX…" : "Select a block to edit"}
          className={`
            w-full h-full p-4 pr-16 overflow-auto font-mono text-sm resize-none
            bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            border rounded-xl transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasActive ? "border-gray-300 dark:border-gray-600" : "border-gray-200 dark:border-gray-700"}
          `}
          disabled={!hasActive}
          spellCheck={false}
          aria-label="LaTeX editor"
        />

        {/* Copy Button */}
        <button
          onClick={onCopy}
          disabled={!hasActive || !latex || copied}
          className={`
            absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
            transition-all duration-200 shadow-md
            ${copied
              ? "bg-green-500 text-white cursor-default"
              : hasActive && latex
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed opacity-60"
            }
          `}
          aria-live="polite"
          aria-label={copied ? "Copied!" : "Copy LaTeX"}
          title={copied ? "Copied!" : "Copy LaTeX"}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>

        {/* Hint */}
        {!hasActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              Click an equation block to edit
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LatexEditor;