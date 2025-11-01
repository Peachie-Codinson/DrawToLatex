// src/App.jsx
import React, { useCallback, useMemo, useState } from "react";
import CanvasBoard from "./components/CanvasBoard";
import LatexEditor from "./components/LatexEditor";
import OutputPane from "./components/OutputPane";
import { MathJaxContext } from "better-react-mathjax";
const mathJaxConfig = {
  loader: { load: ["input/tex", "output/svg", "[tex]/ams"] }, // <-- no output/chtml
  startup: { output: "svg" },                                  // <-- force SVG renderer
  tex: { packages: { "[+]": ["ams"] } },
  svg: {
    fontCache: "none",          // self-contained SVGs (great for export)
    scale: 1.1,
    exFactor: 0.5,
    mtextInheritFont: true,
    displayAlign: "center",
    displayIndent: "0",
  },
  options: {
    enableAssistiveMml: false,
    renderActions: { assistiveMml: [] },
    enableMenu: false,
  },
};



// Small id helper (works everywhere)
const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function App() {
  // Multiple equation blocks
  const [blocks, setBlocks] = useState(() => {
    const first = { id: makeId(), tex: "" };
    return [first];
  });
  const [activeId, setActiveId] = useState(() => blocks[0].id);

  // OCR key/loading (unchanged)
  const [apiKey, setApiKey] = useState(sessionStorage.getItem("OPENAI_KEY") || "");
  const [isLoading, setIsLoading] = useState(false);

  // Convenience: the active block
  const activeBlock = useMemo(
    () => blocks.find((b) => b.id === activeId) || null,
    [blocks, activeId]
  );

  // This replaces your old setLatex(string): it edits the ACTIVE block only
  const setLatex = useCallback(
    (newTex) => {
      setBlocks((prev) => prev.map((b) => (b.id === activeId ? { ...b, tex: newTex } : b)));
    },
    [activeId]
  );

  const addBlock = useCallback((initialTex = "") => {
    const nb = { id: makeId(), tex: initialTex };
    setBlocks((prev) => [...prev, nb]);
    setActiveId(nb.id);
  }, []);

  const deleteBlock = useCallback((id) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (next.length === 0) {
        const fresh = { id: makeId(), tex: "" };
        setActiveId(fresh.id);
        return [fresh];
      }
      // if we removed the active one, move focus to the last item
      setActiveId((curr) => (curr === id ? next[next.length - 1].id : curr));
      return next;
    });
  }, []);

  const setActive = useCallback((id) => setActiveId(id), []);

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="grid grid-cols-1 md:grid-cols-2 h-screen font-sans bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col border-r border-gray-200 dark:border-gray-700">
          <CanvasBoard
            apiKey={apiKey}
            setApiKey={setApiKey}
            // IMPORTANT: Canvas writes to the active block via this callback
            setLatex={setLatex}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          <LatexEditor
            latex={activeBlock?.tex ?? ""}
            setLatex={setLatex}
            hasActive={!!activeBlock}
          />
        </div>

        <OutputPane
          blocks={blocks}
          activeId={activeId}
          setActive={setActive}
          addBlock={addBlock}
          deleteBlock={deleteBlock}
        />
      </div>
    </MathJaxContext>
  );
}

export default App;
