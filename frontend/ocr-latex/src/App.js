// src/App.jsx
import React, { useCallback, useMemo, useState } from "react";
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

  // Height of the *canvas* part (in % of the left column)
  const [canvasPct, setCanvasPct] = useState(70); // 70% canvas, 30% editor

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

  /* --------------------------------------------------------------- */
  /*  Resizer logic – pure mouse events, no extra libs               */
  /* --------------------------------------------------------------- */
  const startResize = useCallback(
    (e) => {
      e.preventDefault();

      const resizer = e.currentTarget; // resizer bar
      const container = resizer.parentElement; // the left column
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
        {/* ---------- LEFT COLUMN (Canvas + Editor) ---------- */}
        <div className="flex flex-col border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Canvas */}
          <div
            style={{ height: `${canvasPct}%` }}
            className="relative flex flex-col bg-white dark:bg-gray-800"
          >
            <CanvasBoard
              apiKey={apiKey}
              setApiKey={setApiKey}
              setLatex={setLatex}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {/* Resizer */}
          <div
            className="h-2 bg-gray-300 dark:bg-gray-700 cursor-row-resize hover:bg-blue-400 transition-colors"
            onMouseDown={startResize}
            title="Drag to resize"
          />

          {/* LaTeX Editor */}
          <div
            style={{ height: `${100 - canvasPct}%` }}
            className="flex flex-col min-h-0"
          >
            <LatexEditor
              latex={activeBlock?.tex ?? ""}
              setLatex={setLatex}
              hasActive={!!activeBlock}
            />
          </div>
        </div>

        {/* ---------- RIGHT COLUMN (Output) ---------- */}
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
