import type { EditorState, FaceBox, TextRect } from "./types";
import { clamp, wrapText } from "./utils";

export function expandFaceBox(face: FaceBox, imageWidth: number, imageHeight: number): FaceBox {
  const padX = face.width * 0.22;
  const padY = face.height * 0.22;
  const x = Math.max(0, face.x - padX);
  const y = Math.max(0, face.y - padY);
  const right = Math.min(imageWidth, face.x + face.width + padX);
  const bottom = Math.min(imageHeight, face.y + face.height + padY);
  return { x, y, width: right - x, height: bottom - y };
}

export function createScaledDetectionInput(
  image: HTMLImageElement,
  requestedScale: number,
  maxEdge = 2200,
) {
  if (Math.abs(requestedScale - 1) < 0.02) {
    return { input: image as HTMLImageElement | HTMLCanvasElement, appliedScale: 1 };
  }

  const sourceMaxEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const maxAllowedScale =
    requestedScale > 1 ? Math.max(1, maxEdge / sourceMaxEdge) : requestedScale;
  const appliedScale =
    requestedScale > 1 ? Math.min(requestedScale, maxAllowedScale) : Math.min(requestedScale, 1);

  if (Math.abs(appliedScale - 1) < 0.02) {
    return { input: image as HTMLImageElement | HTMLCanvasElement, appliedScale: 1 };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * appliedScale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * appliedScale));

  const context = canvas.getContext("2d");
  if (!context) {
    return { input: image as HTMLImageElement | HTMLCanvasElement, appliedScale: 1 };
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { input: canvas, appliedScale };
}

export function rescaleFaceBox(
  face: FaceBox,
  appliedScale: number,
  imageWidth: number,
  imageHeight: number,
): FaceBox {
  const scale = appliedScale || 1;
  const x = clamp(face.x / scale, 0, imageWidth);
  const y = clamp(face.y / scale, 0, imageHeight);
  const width = clamp(face.width / scale, 1, imageWidth - x);
  const height = clamp(face.height / scale, 1, imageHeight - y);
  return { x, y, width, height };
}

export function mergeManualFaces(autoFaces: FaceBox[], manualFaces: FaceBox[]) {
  return manualFaces.filter(
    (manualFace) =>
      !autoFaces.some((autoFace) => {
        const left = Math.max(autoFace.x, manualFace.x);
        const top = Math.max(autoFace.y, manualFace.y);
        const right = Math.min(
          autoFace.x + autoFace.width,
          manualFace.x + manualFace.width,
        );
        const bottom = Math.min(
          autoFace.y + autoFace.height,
          manualFace.y + manualFace.height,
        );
        const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
        if (!intersection) return false;
        const minArea = Math.max(
          1,
          Math.min(
            autoFace.width * autoFace.height,
            manualFace.width * manualFace.height,
          ),
        );
        return intersection / minArea >= 0.35;
      }),
  );
}

export function pixelateFace(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  box: FaceBox,
) {
  const { x, y, width, height } = box;
  const scale = Math.max(8, Math.floor(Math.min(width, height) / 12));
  const miniCanvas = document.createElement("canvas");
  miniCanvas.width = Math.max(1, Math.round(width / scale));
  miniCanvas.height = Math.max(1, Math.round(height / scale));
  const miniCtx = miniCanvas.getContext("2d");
  if (!miniCtx) return;

  miniCtx.imageSmoothingEnabled = true;
  miniCtx.drawImage(canvas, x, y, width, height, 0, 0, miniCanvas.width, miniCanvas.height);

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(miniCanvas, 0, 0, miniCanvas.width, miniCanvas.height, x, y, width, height);
  context.restore();
}

export function blurFace(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  box: FaceBox,
) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = Math.max(1, Math.round(box.width));
  tempCanvas.height = Math.max(1, Math.round(box.height));
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return;

  tempCtx.drawImage(
    canvas,
    box.x,
    box.y,
    box.width,
    box.height,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height,
  );

  context.save();
  context.filter = `blur(${Math.max(16, Math.round(Math.min(box.width, box.height) / 6))}px)`;
  context.drawImage(tempCanvas, box.x, box.y, box.width, box.height);
  context.restore();
}

export function measureTextRect(
  context: CanvasRenderingContext2D,
  imageWidth: number,
  imageHeight: number,
  state: EditorState,
): TextRect | null {
  if (!state.textEnabled || !state.overlayText.trim()) {
    return null;
  }

  context.save();
  context.font = `700 ${state.textSize}px Geist Mono, monospace`;
  const maxWidth = Math.max(
    80,
    Math.min(imageWidth - state.textX - 24, Math.floor(imageWidth * 0.58)),
  );
  const lines = wrapText(
    context,
    state.overlayText.trim(),
    maxWidth - state.textPadding * 2,
  );
  const lineHeight = state.textSize * 1.15;
  const longestLine = lines.reduce(
    (largest, line) => Math.max(largest, context.measureText(line || " ").width),
    0,
  );
  context.restore();

  const width = Math.min(maxWidth, Math.max(80, longestLine + state.textPadding * 2));
  const height = Math.max(
    lineHeight + state.textPadding * 2,
    lines.length * lineHeight + state.textPadding * 2,
  );
  const x = Math.max(0, Math.min(state.textX, imageWidth - width));
  const y = Math.max(0, Math.min(state.textY, imageHeight - height));

  return {
    x,
    y,
    width,
    height,
    lines,
    padding: state.textPadding,
    fontSize: state.textSize,
    boxColor: state.boxColor,
    textColor: state.textColor,
    lineHeight,
  };
}

export function drawTextRect(
  context: CanvasRenderingContext2D,
  imageWidth: number,
  imageHeight: number,
  state: EditorState,
) {
  const rect = measureTextRect(context, imageWidth, imageHeight, state);
  if (!rect) return null;

  context.save();
  context.fillStyle = rect.boxColor;
  context.globalAlpha = 0.9;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);
  context.globalAlpha = 1;
  context.fillStyle = rect.textColor;
  context.font = `700 ${rect.fontSize}px Geist Mono, monospace`;
  context.textBaseline = "top";

  let drawY = rect.y + rect.padding;
  for (const line of rect.lines) {
    context.fillText(line, rect.x + rect.padding, drawY, rect.width - rect.padding * 2);
    drawY += rect.lineHeight;
  }

  context.restore();
  return rect;
}
