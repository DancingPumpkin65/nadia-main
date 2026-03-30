import type { DisplayBox } from "./types";

export function makeObjectUrl(file: File) {
  return URL.createObjectURL(file);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeBox(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): DisplayBox {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  };
}

export function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = words.shift() ?? "";
    for (const word of words) {
      const candidate = `${current} ${word}`.trim();
      if (context.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }

  return lines;
}
