import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import { initialDetectorMessage, initialEditorState } from "./constants";
import {
  blurFace,
  drawTextRect,
  expandFaceBox,
  mergeManualFaces,
  pixelateFace,
} from "./canvas";
import { stageFeatures } from "./snapshotStage";
import { useFaceDetector } from "./useFaceDetector";
import type { DisplayBox, EditorState, FaceBox, TextRect } from "./types";
import { clamp, makeObjectUrl, normalizeBox } from "./utils";

type UseFacePrivacyEditorResult = {
  selectedFile: File | null;
  sourceUrl: string | null;
  status: string;
  processedLabel: string;
  editorState: EditorState;
  downloadUrl: string | null;
  detectorMessage: string;
  textRect: TextRect | null;
  isRendering: boolean;
  faces: FaceBox[];
  manualFaces: FaceBox[];
  selectionPreview: DisplayBox | null;
  hasRenderableText: boolean;
  renderDescription: string;
  originalImageRef: RefObject<HTMLImageElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  updateEditorState: (patch: Partial<EditorState>) => void;
  handleFileChange: (file: File | null) => void;
  renderImage: () => Promise<void>;
  resetTextPosition: () => void;
  clearManualFaces: () => void;
  startManualSelection: (event: ReactMouseEvent<HTMLDivElement>) => void;
  handleCanvasMouseDown: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
  getManualBoxStyle: (face: FaceBox) => React.CSSProperties | null;
};

export function useFacePrivacyEditor(): UseFacePrivacyEditorResult {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Waiting for an image.");
  const [processedLabel, setProcessedLabel] = useState("Ready when you are");
  const [editorState, setEditorState] = useState<EditorState>(initialEditorState);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [detectorMessage, setDetectorMessage] = useState(initialDetectorMessage);
  const [textRect, setTextRect] = useState<TextRect | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [faces, setFaces] = useState<FaceBox[]>([]);
  const [manualFaces, setManualFaces] = useState<FaceBox[]>([]);
  const [selectionPreview, setSelectionPreview] = useState<DisplayBox | null>(null);
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);

  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestStateRef = useRef(editorState);
  const draggingRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const manualSelectionRef = useRef<{ startX: number; startY: number } | null>(null);
  const selectionPreviewRef = useRef<DisplayBox | null>(null);
  const detectFaces = useFaceDetector();

  useEffect(() => {
    latestStateRef.current = editorState;
  }, [editorState]);

  useEffect(() => {
    selectionPreviewRef.current = selectionPreview;
  }, [selectionPreview]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [sourceUrl, downloadUrl]);

  const hasRenderableText = useMemo(
    () =>
      stageFeatures.textOverlay &&
      editorState.textEnabled &&
      editorState.overlayText.trim().length > 0,
    [editorState.overlayText, editorState.textEnabled],
  );

  const renderDescription = useMemo(() => {
    if (!faces.length) {
      return hasRenderableText
        ? "The current render contains the auto-sized text rectangle."
        : "Render to preview the processed result.";
    }

    if (
      manualFaces.length > 0 &&
      detectorMessage.includes("No face detected automatically")
    ) {
      return "The current render masked " + faces.length + " manual face selection" + (faces.length > 1 ? "s." : ".");
    }

    if (manualFaces.length > 0) {
      return "The current render masked " + faces.length + " face" + (faces.length > 1 ? "s" : "") + ", including manual fallback selections.";
    }

    return "The current render masked " + faces.length + " detected face" + (faces.length > 1 ? "s." : ".");
  }, [detectorMessage, faces.length, hasRenderableText, manualFaces.length]);

  function getImageDisplayPoint(event: MouseEvent | ReactMouseEvent<HTMLElement>) {
    const image = originalImageRef.current;
    if (!image) return null;

    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
      width: rect.width,
      height: rect.height,
    };
  }

  function getCanvasPoint(event: MouseEvent | ReactMouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function addManualFace(displayBox: DisplayBox) {
    if (!stageFeatures.manualSelection) return;

    const image = originalImageRef.current;
    if (!image) return;

    const rect = image.getBoundingClientRect();
    if (!rect.width || !rect.height || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    const scaleX = image.naturalWidth / rect.width;
    const scaleY = image.naturalHeight / rect.height;
    const face = expandFaceBox(
      {
        x: displayBox.x * scaleX,
        y: displayBox.y * scaleY,
        width: displayBox.width * scaleX,
        height: displayBox.height * scaleY,
      },
      image.naturalWidth,
      image.naturalHeight,
    );

    setManualFaces((current) => [...current, face]);
    setDetectorMessage("Manual face fallback added. Render to apply the mask.");
  }

  async function renderImage() {
    const image = originalImageRef.current;
    const canvas = canvasRef.current;
    if (!image || !canvas) {
      setStatus("Choose an image first.");
      return;
    }

    if (!image.naturalWidth || !image.naturalHeight) {
      try {
        await image.decode();
      } catch {}
    }

    if (!image.naturalWidth || !image.naturalHeight) {
      setStatus("The image is still loading. Try rendering again in a moment.");
      return;
    }

    setIsRendering(true);
    setStatus("Rendering locally in your browser...");
    setProcessedLabel("Working...");

    try {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const detectionResult = await detectFaces(image);
      setDetectorMessage(detectionResult.message);

      const autoFaces = detectionResult.faces;
      const manualFallbackFaces = stageFeatures.manualSelection
        ? mergeManualFaces(autoFaces, manualFaces)
        : [];
      const nextFaces = [...autoFaces, ...manualFallbackFaces];
      setFaces(nextFaces);

      if (stageFeatures.maskModes) {
        for (const face of nextFaces) {
          if (latestStateRef.current.mode === "blur") {
            blurFace(context, canvas, face);
          } else {
            pixelateFace(context, canvas, face);
          }
        }
      }

      const nextTextRect = stageFeatures.textOverlay
        ? drawTextRect(context, canvas.width, canvas.height, latestStateRef.current)
        : null;
      setTextRect(nextTextRect);

      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (value) {
            resolve(value);
          } else {
            reject(new Error("Could not export the rendered image."));
          }
        }, "image/png");
      });
      const nextDownloadUrl = URL.createObjectURL(blob);
      setDownloadUrl(nextDownloadUrl);

      if (!stageFeatures.maskModes) {
        setProcessedLabel("Rendered");
        setStatus("Copied the uploaded image into the browser canvas and exported the result.");
      } else if (nextFaces.length > 0) {
        const detectedCount = autoFaces.length;
        const manualCount = manualFallbackFaces.length;

        setProcessedLabel(nextFaces.length + " face" + (nextFaces.length > 1 ? "s" : "") + " masked");
        if (manualCount > 0 && detectedCount > 0) {
          setStatus(
            nextTextRect
              ? "Masked " + nextFaces.length + " face(s), including " + manualCount + " manual fallback selection(s), and placed the text overlay."
              : "Masked " + nextFaces.length + " face(s), including " + manualCount + " manual fallback selection(s).",
          );
        } else if (manualCount > 0) {
          setStatus(
            nextTextRect
              ? "Masked " + manualCount + " manual face selection(s) and placed the text overlay."
              : "Masked " + manualCount + " manual face selection(s).",
          );
        } else {
          setStatus(
            nextTextRect
              ? "Masked " + detectedCount + " face(s) and placed the text overlay."
              : "Masked " + detectedCount + " face(s).",
          );
        }
      } else if (nextTextRect) {
        setProcessedLabel("Text overlay rendered");
        setStatus("No face was detected, but the text overlay was rendered.");
      } else {
        setProcessedLabel(stageFeatures.autoDetect ? "Rendered" : "Preview rendered");
        setStatus(
          stageFeatures.autoDetect
            ? "No face was detected, so the result matches the original image."
            : "Applied the selected masking preview and exported the rendered image.",
        );
      }
      setHasRenderedOnce(true);
    } catch (error) {
      setProcessedLabel("Could not render");
      setStatus(error instanceof Error ? error.message : "Rendering failed.");
    } finally {
      setIsRendering(false);
    }
  }

  function handleFileChange(file: File | null) {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    setSelectedFile(file);
    setFaces([]);
    setManualFaces([]);
    setTextRect(null);
    setSelectionPreview(null);
    manualSelectionRef.current = null;
    selectionPreviewRef.current = null;
    setHasRenderedOnce(false);
    setProcessedLabel("Ready when you are");
    setDetectorMessage(initialDetectorMessage);

    if (!file) {
      setSourceUrl(null);
      setStatus("Waiting for an image.");
      return;
    }

    const nextUrl = makeObjectUrl(file);
    setSourceUrl(nextUrl);
    setStatus("Image loaded. Press render to build the result.");
  }

  function updateEditorState(patch: Partial<EditorState>) {
    setEditorState((current) => ({ ...current, ...patch }));
  }

  function resetTextPosition() {
    if (!stageFeatures.textOverlay) return;

    setEditorState((current) => ({
      ...current,
      textX: initialEditorState.textX,
      textY: initialEditorState.textY,
      textSize: initialEditorState.textSize,
      textPadding: initialEditorState.textPadding,
    }));
  }

  function clearManualFaces() {
    if (!stageFeatures.manualSelection) return;
    setManualFaces([]);
    setDetectorMessage("Manual face fallback cleared. Auto-detect is still available.");
  }

  function startManualSelection(event: ReactMouseEvent<HTMLDivElement>) {
    if (!stageFeatures.manualSelection || event.button !== 0) return;

    const point = getImageDisplayPoint(event);
    if (!point) return;

    event.preventDefault();
    const initialSelection = { x: point.x, y: point.y, width: 0, height: 0 };
    manualSelectionRef.current = { startX: point.x, startY: point.y };
    selectionPreviewRef.current = initialSelection;
    setSelectionPreview(initialSelection);
  }

  function handleCanvasMouseDown(event: ReactMouseEvent<HTMLCanvasElement>) {
    if (!stageFeatures.draggableText || !textRect) return;
    const point = getCanvasPoint(event);
    const hit =
      point.x >= textRect.x &&
      point.x <= textRect.x + textRect.width &&
      point.y >= textRect.y &&
      point.y <= textRect.y + textRect.height;

    if (!hit) return;

    draggingRef.current = {
      offsetX: point.x - textRect.x,
      offsetY: point.y - textRect.y,
    };
  }

  function getManualBoxStyle(face: FaceBox): React.CSSProperties | null {
    const image = originalImageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return null;

    return {
      left: (face.x / image.naturalWidth) * 100 + "%",
      top: (face.y / image.naturalHeight) * 100 + "%",
      width: (face.width / image.naturalWidth) * 100 + "%",
      height: (face.height / image.naturalHeight) * 100 + "%",
    };
  }

  useEffect(() => {
    if (!hasRenderedOnce || !sourceUrl) return;
    if (!stageFeatures.manualSelection && !stageFeatures.textOverlay) return;
    void renderImage();
  }, [
    hasRenderedOnce,
    sourceUrl,
    editorState.mode,
    editorState.textEnabled,
    editorState.overlayText,
    editorState.textX,
    editorState.textY,
    editorState.textSize,
    editorState.textPadding,
    editorState.boxColor,
    editorState.textColor,
    manualFaces,
  ]);

  useEffect(() => {
    function onMove(event: MouseEvent) {
      if (stageFeatures.draggableText && draggingRef.current && textRect) {
        const point = getCanvasPoint(event);
        setEditorState((current) => ({
          ...current,
          textX: Math.max(0, Math.round(point.x - draggingRef.current!.offsetX)),
          textY: Math.max(0, Math.round(point.y - draggingRef.current!.offsetY)),
        }));
        return;
      }

      if (!stageFeatures.manualSelection || !manualSelectionRef.current) return;

      const point = getImageDisplayPoint(event);
      if (!point) return;

      const nextSelection = normalizeBox(
        manualSelectionRef.current.startX,
        manualSelectionRef.current.startY,
        point.x,
        point.y,
      );
      selectionPreviewRef.current = nextSelection;
      setSelectionPreview(nextSelection);
    }

    function onUp() {
      draggingRef.current = null;

      if (!stageFeatures.manualSelection || !manualSelectionRef.current) return;

      const nextSelection = selectionPreviewRef.current;
      manualSelectionRef.current = null;

      if (!nextSelection || nextSelection.width < 18 || nextSelection.height < 18) {
        selectionPreviewRef.current = null;
        setSelectionPreview(null);
        return;
      }

      addManualFace(nextSelection);
      selectionPreviewRef.current = null;
      setSelectionPreview(null);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [textRect]);

  useEffect(() => {
    if (!sourceUrl || !canvasRef.current) return;
    canvasRef.current.classList.toggle(
      "draggable",
      Boolean(stageFeatures.draggableText && textRect),
    );
  }, [sourceUrl, textRect]);

  return {
    selectedFile,
    sourceUrl,
    status,
    processedLabel,
    editorState,
    downloadUrl,
    detectorMessage,
    textRect,
    isRendering,
    faces,
    manualFaces,
    selectionPreview,
    hasRenderableText,
    renderDescription,
    originalImageRef,
    canvasRef,
    updateEditorState,
    handleFileChange,
    renderImage,
    resetTextPosition,
    clearManualFaces,
    startManualSelection,
    handleCanvasMouseDown,
    getManualBoxStyle,
  };
}
