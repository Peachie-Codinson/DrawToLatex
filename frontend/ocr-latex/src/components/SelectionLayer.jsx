import React, { useRef, useEffect } from "react";

const SelectionLayer = ({
  selection,
  isDragging,
  dashOffset,
  canvasWidth,
  canvasHeight,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (!selection) return;

    const { x, y, w, h } = selection;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }, [selection, dashOffset, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="absolute inset-0 pointer-events-none"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

export default SelectionLayer;