// src/App.jsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import CanvasBoard from "./components/CanvasBoard";
import LatexEditor from "./components/LatexEditor";
import OutputPane from "./components/OutputPane";
import { MathJaxContext } from "better-react-mathjax";

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

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function App() {
  const [blocks, setBlocks] = useState(() => [{ id: makeId(), tex: "" }]);
  const [activeId, setActiveId] = useState(() => blocks[0].id);
  const [apiKey, setApiKey] = useState(sessionStorage.getItem("OPENAI_KEY") || "");
  const [isLoading, setIsLoading] = useState(false);

  // Canvas height in % (only used on desktop)
  const [canvasPct, setCanvasPct] = useState(70);

  // Detect mobile to disable resizer
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Resizer – only active on desktop
  const startResize = useCallback(
    (e) => {
      if (isMobile) return;
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
    [canvasPct, isMobile]
  );

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* ========== MOBILE: STACKED, DESKTOP: LEFT COLUMN ========== */}
        <div className="flex-1 flex flex-col md:w-1/2 md:border-r md:border-gray-200 dark:md:border-gray-700 overflow-hidden">
          {/* Canvas */}
          <div
            className="relative flex flex-col bg-white dark:bg-gray-800"
            style={{ height: isMobile ? "40vh" : `${canvasPct}%` }}
          >
            <CanvasBoard
              apiKey={apiKey}
              setApiKey={setApiKey}
              setLatex={setLatex}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {/* Resizer – hidden on mobile */}
          {!isMobile && (
            <div
              className="h-2 bg-gray-300 dark:bg-gray-700 cursor-row-resize hover:bg-blue-400 transition-colors"
              onMouseDown={startResize}
              title="Drag to resize"
            />
          )}

          {/* LaTeX Editor */}
          <div
            className="flex flex-col min-h-0"
            style={{ height: isMobile ? "30vh" : `${100 - canvasPct}%` }}
          >
            <LatexEditor
              latex={activeBlock?.tex ?? ""}
              setLatex={setLatex}
              hasActive={!!activeBlock}
            />
          </div>
        </div>

        {/* ========== OUTPUT PANE – FULL WIDTH ON MOBILE ========== */}
        <div className="flex-1 md:w-1/2 overflow-hidden">
          <OutputPane
            blocks={blocks}
            activeId={activeId}
            setActive={setActive}
            addBlock={addBlock}
            deleteBlock={deleteBlock}
            updateBlocksOrder={setBlocks}
          />
        </div>
      </div>
    </MathJaxContext>
  );
}

export default App;