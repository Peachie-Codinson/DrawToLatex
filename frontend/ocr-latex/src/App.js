import React, { useState } from "react";
import { MathJaxContext } from "better-react-mathjax";
import CanvasBoard from "./components/CanvasBoard";
import LatexEditor from "./components/LatexEditor";
import OutputPane from "./components/OutputPane";

const mjxConfig = {
  loader: { load: ["input/tex", "output/svg", "[tex]/ams"] },
  tex: { packages: { "[+]": ["ams"] } },
  svg: {
    fontCache: "none",   // self-contained <svg>, best for exporting
    scale: 1.1,          // slight up-scale for on-screen legibility
    exFactor: 0.5,       // makes \text{} sizing closer to UI fonts
    mtextInheritFont: true, // \text{} will inherit the app font
    displayAlign: "center",
    displayIndent: "0"
  },
  options: { enableAssistiveMml: false, renderActions: { assistiveMml: [] }, enableMenu: false },
};

export default function App() {
  const [latex, setLatex] = useState("");
  const [apiKey, setApiKey] = useState(sessionStorage.getItem("OPENAI_KEY") || "");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <MathJaxContext
      version={3}
      config={mjxConfig}
      // 👇 This forces the SVG renderer bundle (not the default chtml)
      src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
      // Optional: ensure HMR or re-mount switches cleanly
      key="mathjax-svg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
        <div className="flex flex-col">
          <CanvasBoard
            apiKey={apiKey}
            setApiKey={setApiKey}
            setLatex={setLatex}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          <LatexEditor latex={latex} setLatex={setLatex} />
        </div>
        <OutputPane latex={latex} isLoading={isLoading} />
      </div>
    </MathJaxContext>
  );
}
