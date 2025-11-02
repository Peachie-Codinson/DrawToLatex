// src/utils/blockUtils.js
export const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Extract raw equation lines from a block's LaTeX.
 * Handles:
 *   - Single \[ … \]
 *   - \begin{gathered} … \end{gathered}
 *   - \begin{align*} … \end{align*}
 */
export const extractRawLines = (tex) => {
  const lines = [];
  const trimmed = tex.trim();

  const centeredMatches = trimmed.match(/\\begin\{gathered\}\s*([\s\S]*?)\s*\\end\{gathered\}/i);
  if (centeredMatches) {
    const body = centeredMatches[1];
    const rows = body.split(/\\\\\s*/).map((r) => r.trim()).filter(Boolean);
    for (const row of rows) {
      const cleaned = row.replace(/&/g, "").trim(); // remove alignment tabs
      if (cleaned) lines.push(cleaned);
    }
    return lines;
  }

  // --- align* environment ---
  const alignMatch = trimmed.match(/\\begin\{align[*]?\}\s*([\s\S]*?)\s*\\end\{align[*]?\}/i);
  if (alignMatch) {
    const body = alignMatch[1];
    const rows = body.split(/\\\\\s*/).map((r) => r.trim()).filter(Boolean);
    for (const row of rows) {
      const cleaned = row.replace(/&/g, "").trim(); // remove alignment tabs
      if (cleaned) lines.push(cleaned);
    }
    return lines;
  }

  // --- Single \[ … \] ---
  const singleMatch = trimmed.match(/^\\\[([\s\S]*?)\\\]$/);
  if (singleMatch) {
    const inner = singleMatch[1].trim();
    if (inner) lines.push(inner);
    return lines;
  }

  // --- Fallback: plain text ---
  if (trimmed) lines.push(trimmed);
  return lines;
};

/**
 * Split a block into multiple single-line \[ … \] blocks.
 * - If already single → return [original tex]
 * - Else → extract all equations → wrap each in \[ … \]
 */
export const splitIntoSingleBlocks = (tex) => {
  const trimmed = tex.trim();

  // --- Case 1: Already a single \[ … \] → do nothing ---
  if (/^\\\[[\s\S]*?\\\]$/.test(trimmed)) {
    return [tex]; // keep as-is
  }

  // --- Case 2: Multiple \[ … \] or align* → extract lines ---
  const rawLines = extractRawLines(tex);

  // If only one line and it's not wrapped → treat as single
  if (rawLines.length === 1 && !/^\\\[/.test(rawLines[0])) {
    return [`\\[ ${rawLines[0]} \\]`];
  }

  // Otherwise: wrap each raw line in \[ … \]
  return rawLines.map((line) => `\\[ ${line} \\]`);
};

/**
 * Insert & before the first = in a line (for align mode)
 */
const addAlignmentTab = (line) => {
  const eqIndex = line.indexOf("=");
  if (eqIndex === -1) return line;
  return line.slice(0, eqIndex) + "&" + line.slice(eqIndex);
};

/**
 * Group raw lines into one block
 */
export const groupLines = (rawLines, mode) => {
  if (!rawLines.length) return "";

  if (mode === "centered") {
    // Use \begin{gathered} … \end{gathered} from amsmath
    const body = rawLines.join(" \\\\\n");
    return `\\begin{gathered}\n${body}\n\\end{gathered}`;
  }

  if (mode === "aligned") {
    const alignedLines = rawLines.map(addAlignmentTab);
    const body = alignedLines.join(" \\\\\n");
    return `\\begin{align*}\n${body}\n\\end{align*}`;
  }

  return rawLines[0];
};