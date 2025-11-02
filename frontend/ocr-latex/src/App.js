// src/App.jsx
import React, { useCallback, useMemo, useState } from "react";
import CanvasBoard from "./components/CanvasBoard";
import LatexEditor from "./components/LatexEditor";
import OutputPane from "./components/OutputPane";
import { MathJaxContext } from "better-react-mathjax";
import { makeId } from "./utils/blockUtils";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/svg", "[tex]/ams"] },
  startup: { output: "svg" },
  tex: { packages: { "[+]": ["ams"] } },
  svg: {
    fontCache: "none",
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


function App() {
  const [blocks, setBlocks] = useState(() => [{ id: makeId(), tex: "" }]);
  const [activeId, setActiveId] = useState(() => blocks[0].id);
  const [apiKey, setApiKey] = useState(sessionStorage.getItem("OPENAI_KEY") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [canvasPct, setCanvasPct] = useState(70);

  const activeBlock = useMemo(
    () => blocks.find((b) => b.id === activeId) || null,
    [blocks, activeId]
  );

  const setLatex = useCallback(
    (newTex) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === activeId ? { ...b, tex: newTex } : b))
      );
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
      setActiveId((curr) => (curr === id ? next[next.length - 1].id : curr));
      return next;
    });
  }, []);

  const setActive = useCallback((id) => setActiveId(id), []);

  // NEW: bulk replace (used by group / split)
  const replaceBlocks = useCallback((newArray) => {
    setBlocks(newArray);
    // keep the *last* created block active
    if (newArray.length) setActiveId(newArray[newArray.length - 1].id);
  }, []);

  /* --------------------------------------------------------------- */
  /*  Resizer – unchanged                                            */
  /* --------------------------------------------------------------- */
  const startResize = useCallback(
    (e) => {
      e.preventDefault();

      const resizer = e.currentTarget;
      const container = resizer.parentElement;
      if (!container) return;

      const startY = e.clientY;
      const startHeight = container.clientHeight;
      const startPct = canvasPct;

      const onMove = (moveEv) => {
        const delta = moveEv.clientY - startY;
        const deltaPct = (delta / startHeight) * 100;
        const newPct = Math.max(30, Math.min(85, startPct + deltaPct));
        setCanvasPct(newPct);
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [canvasPct]
  );

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="grid grid-cols-1 md:grid-cols-2 h-screen font-sans bg-gray-50 dark:bg-gray-900">
        {/* LEFT COLUMN */}
        <div className="flex flex-col border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          <div style={{ height: `${canvasPct}%` }} className="relative flex flex-col bg-white dark:bg-gray-800">
            <CanvasBoard apiKey={apiKey} setApiKey={setApiKey} setLatex={setLatex} isLoading={isLoading} setIsLoading={setIsLoading} />
          </div>

          <div className="h-2 bg-gray-300 dark:bg-gray-700 cursor-row-resize hover:bg-blue-400 transition-colors" onMouseDown={startResize} title="Drag to resize" />

          <div style={{ height: `${100 - canvasPct}%` }} className="flex flex-col min-h-0">
            <LatexEditor latex={activeBlock?.tex ?? ""} setLatex={setLatex} hasActive={!!activeBlock} />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <OutputPane
          blocks={blocks}
          activeId={activeId}
          setActive={setActive}
          addBlock={addBlock}
          deleteBlock={deleteBlock}
          updateBlocksOrder={setBlocks}
          replaceBlocks={replaceBlocks}  
        />
      </div>
    </MathJaxContext>
  );
}

export default App;