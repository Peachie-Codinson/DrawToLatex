import html2canvas from "html2canvas";
import { useCallback, useEffect, useRef } from "react";

export function useRenderMath(latex, fontSize, isDark) {
  const outputRef = useRef(null);

  const render = useCallback(async () => {
    const output = outputRef.current;
    if (!output) return;
    const text = latex || "";
    const equations = text.match(/(\$\$[\s\S]*?\$\$)|(?:\\\[([\s\S]*?)\\\])/g) || [];
    output.innerHTML = "";

    if (equations.length === 0) {
      output.innerHTML =
        '<div class="error">No equations found. Use $$ $$ or \\[ \\] delimiters.</div>';
      return;
    }

    equations.forEach((eq, i) => {
      const div = document.createElement("div");
      div.className = "equation";
      div.id = "eq-" + i;
      const eqDiv = document.createElement("div");
      eqDiv.textContent = eq;
      div.appendChild(eqDiv);
      output.appendChild(div);
    });

    await window.MathJax.typesetPromise([output]);

    equations.forEach((eq, i) => {
      const div = document.getElementById("eq-" + i);
      const exportBtn = document.createElement("button");
      exportBtn.textContent = "⬇️";
      exportBtn.className = "btn btn-sm btn-primary float-end mb-2";
      exportBtn.onclick = async () => {
        const node = div.querySelector("mjx-container");
        if (!node) return alert("Equation not rendered yet!");
        node.style.color = isDark ? "#fff" : "#000";

        const canvas = await html2canvas(node, {
          backgroundColor: isDark ? "#111827" : "#ffffff",
          scale: 3,
          useCORS: true,
        });
        const link = document.createElement("a");
        link.download = `equation-${i}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        node.style.color = "";
      };
      div.prepend(exportBtn);
    });
  }, [latex, fontSize, isDark]);

  useEffect(() => {
    render();
  }, [render]);

  return outputRef;
}
