import React, { useRef, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("black");
  const [brushSize, setBrushSize] = useState(3);
  const [latex, setLatex] = useState("");
  const [apiKey, setApiKey] = useState(sessionStorage.getItem("OPENAI_KEY") || "");
  const [copied, setCopied] = useState(false);

  // === Drawing setup ===
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === "eraser" ? "white" : color;
  }, [brushSize, color, tool]);

  // === Drawing handlers ===
  const startDrawing = (e) => {
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const ctx = ctxRef.current;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };
  const stopDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // === OCR send ===
  const sendImage = async () => {
    if (!apiKey) {
      alert("Please enter your OpenAI API key first!");
      return;
    }

    sessionStorage.setItem("OPENAI_KEY", apiKey);

    const canvas = canvasRef.current;
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const formData = new FormData();
    formData.append("image", blob);

    try {
      const res = await fetch("https://drawtolatex.onrender.com/ocr", {
        // ⚠️ Replace with your Render URL when deploying
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();
      setLatex(data.latex || data.detail || "No response received.");
    } catch (err) {
      console.error("Fetch failed:", err);
      alert("❌ Could not reach the backend.\nCheck your backend URL and CORS settings.");
    }
  };

  // === Copy code ===
  const copyToClipboard = () => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // === UI ===
  return (
    <div className="container text-center mt-4" style={{ fontFamily: "Times New Roman" }}>
      <h2 className="mb-3">🧮 OCR to LaTeX Drawing App</h2>

      <div className="mb-3">
        <input
          type="password"
          placeholder="Enter your OpenAI API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="form-control d-inline-block w-50"
        />
        <button
          className="btn btn-outline-danger ms-2"
          onClick={() => sessionStorage.removeItem("OPENAI_KEY")}
        >
          Forget Key
        </button>
      </div>

      <div className="btn-group mb-3" role="group">
        <button
          className={`btn ${tool === "brush" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setTool("brush")}
        >
          Brush
        </button>
        <button
          className={`btn ${tool === "eraser" ? "btn-danger" : "btn-outline-danger"}`}
          onClick={() => setTool("eraser")}
        >
          Eraser
        </button>
        <button className="btn btn-secondary" onClick={clearCanvas}>
          Clear
        </button>
      </div>

      <div className="d-flex justify-content-center align-items-center mb-3">
        <label className="me-2">Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="form-control form-control-color"
        />
        <label className="ms-3 me-2">Size:</label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="form-range w-25"
        />
      </div>

      <div className="mb-3">
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          style={{
            border: "2px solid black",
            cursor: tool === "eraser" ? "crosshair" : "pointer",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
          }}
        />
      </div>

      <div className="mb-4">
        <button className="btn btn-success" onClick={sendImage}>
          🔍 Transcribe to LaTeX
        </button>
      </div>

      {latex && (
        <div className="card shadow-sm mx-auto" style={{ maxWidth: "900px" }}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>🧾 LaTeX Output</span>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={copyToClipboard}
            >
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>
          <div className="card-body">
            <pre
              style={{
                textAlign: "left",
                background: "#f9f9f9",
                padding: "10px",
                borderRadius: "5px",
                whiteSpace: "pre-wrap",
              }}
            >
              {latex}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
