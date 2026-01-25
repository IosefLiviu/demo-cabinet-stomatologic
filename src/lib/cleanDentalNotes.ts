// Utility to ensure technical diagnostic payloads (coordinate arrays / nested JSON)
// never leak into user-facing UI (tooltips, labels, etc.).

function extractBalancedJson(str: string, startIndex: number): string | null {
  if (str[startIndex] !== "[") return null;
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === "[") depth++;
    else if (str[i] === "]") depth--;
    if (depth === 0) return str.slice(startIndex, i + 1);
  }
  return null;
}

function stripTaggedBalanced(input: string, tagStart: "[DIAGNOSTICS:" | "[DIAGLINES:") {
  let result = input;
  const idx = result.indexOf(tagStart);
  if (idx === -1) return result;

  const jsonStart = idx + tagStart.length;
  const jsonContent = extractBalancedJson(result, jsonStart);
  if (!jsonContent) return result;

  // The stored format is: [TAG:<balanced-json>]
  return result.replace(`${tagStart}${jsonContent}]`, "");
}

function stripOrphanLeadingJsonArrays(input: string): string {
  let result = input;

  // Some older saved notes may start with raw coordinate arrays like:
  // [-0.034..., 0.002..., ...]
  // (possibly multiple arrays on separate lines)
  // We'll strip consecutive leading bracketed arrays as long as the leading
  // chunk contains no letters.
  for (let i = 0; i < 50; i++) {
    const trimmed = result.trimStart();
    if (!trimmed.startsWith("[")) break;
    if (/[a-zA-ZăâîșțĂÂÎȘȚ]/.test(trimmed)) break;

    const leading = extractBalancedJson(trimmed, 0);
    if (!leading) break;

    result = trimmed
      .slice(leading.length)
      .replace(/^[\s,]+/, "") // eat separators/newlines between arrays
      .trimStart();
  }

  return result;
}

function stripNumericNoisePrefix(original: string): string {
  // Some legacy broken saves may contain a numeric-heavy prefix *before* a proper
  // [DIAGLINES:...] tag (e.g. ",[-0.03,...],...]],\"label\":\"nerv\"}]]\n[DIAGLINES:...").
  // If the prefix contains many floats, we remove it entirely.
  const firstTagIdx = (() => {
    const a = original.indexOf("[DIAGNOSTICS:");
    const b = original.indexOf("[DIAGLINES:");
    if (a === -1) return b;
    if (b === -1) return a;
    return Math.min(a, b);
  })();

  if (firstTagIdx <= 0) return original;

  const prefix = original.slice(0, firstTagIdx);
  const floatMatches = prefix.match(/-?\d+\.\d+/g) ?? [];
  // Threshold tuned to avoid stripping normal text with a couple of numbers.
  if (floatMatches.length < 6) return original;

  return original.slice(firstTagIdx);
}

export function cleanDentalNotes(notes: string | null | undefined): string {
  if (!notes) return "";

  let result = notes;
  result = stripNumericNoisePrefix(result);
  result = stripTaggedBalanced(result, "[DIAGNOSTICS:");
  result = stripTaggedBalanced(result, "[DIAGLINES:");
  result = stripOrphanLeadingJsonArrays(result);

  return result.replace(/^\n+|\n+$/g, "").trim();
}
