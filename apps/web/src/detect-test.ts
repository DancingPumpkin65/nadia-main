import {
  FaceDetector as MediaPipeFaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";

type FaceBox = { x: number; y: number; width: number; height: number };

function expandFaceBox(face: FaceBox, imageWidth: number, imageHeight: number): FaceBox {
  const padX = face.width * 0.22;
  const padY = face.height * 0.22;
  const x = Math.max(0, face.x - padX);
  const y = Math.max(0, face.y - padY);
  const right = Math.min(imageWidth, face.x + face.width + padX);
  const bottom = Math.min(imageHeight, face.y + face.height + padY);
  return { x, y, width: right - x, height: bottom - y };
}

function pixelateFace(
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

async function detectFaces(image: HTMLImageElement) {
  await tf.ready();
  try {
    await tf.setBackend("webgl");
    await tf.ready();
  } catch {}

  const imageWidth = image.naturalWidth;
  const imageHeight = image.naturalHeight;
  let rawFaces: FaceBox[] = [];
  let detector = "none";

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm",
    );
    const faceDetector = await MediaPipeFaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
    });
    const result = faceDetector.detect(image);
    rawFaces = result.detections
      .filter((detection) => Boolean(detection.boundingBox))
      .map((detection) => ({
        x: detection.boundingBox!.originX,
        y: detection.boundingBox!.originY,
        width: detection.boundingBox!.width,
        height: detection.boundingBox!.height,
      }));
    if (rawFaces.length) detector = "mediapipe";
  } catch {}

  if (!rawFaces.length) {
    const model = await blazeface.load();
    const predictions = await model.estimateFaces(image, false);
    rawFaces = predictions.map((prediction) => {
      const [x1, y1] = prediction.topLeft as [number, number];
      const [x2, y2] = prediction.bottomRight as [number, number];
      return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
    });
    if (rawFaces.length) detector = "blazeface";
  }

  if (!rawFaces.length) {
    const FaceDetectorCtor = (
      window as Window & {
        FaceDetector?: new (options: {
          fastMode: boolean;
          maxDetectedFaces: number;
        }) => {
          detect(input: HTMLImageElement): Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
        };
      }
    ).FaceDetector;
    if (FaceDetectorCtor) {
      try {
        const detectorInstance = new FaceDetectorCtor({
          fastMode: true,
          maxDetectedFaces: 10,
        });
        const results = await detectorInstance.detect(image);
        rawFaces = results.map((result) => {
          const { x, y, width, height } = result.boundingBox;
          return { x, y, width, height };
        });
        if (rawFaces.length) detector = "face-detector-api";
      } catch {}
    }
  }

  return {
    detector,
    faces: rawFaces.map((face) => expandFaceBox(face, imageWidth, imageHeight)),
  };
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  const imagePath = params.get("image") ?? "/image.png";
  const image = new Image();
  image.src = imagePath;
  await image.decode();

  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No canvas context");

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.drawImage(image, 0, 0);

  const { detector, faces } = await detectFaces(image);
  for (const face of faces) {
    pixelateFace(context, canvas, face);
    context.save();
    context.strokeStyle = "#ff0000";
    context.lineWidth = 4;
    context.strokeRect(face.x, face.y, face.width, face.height);
    context.restore();
  }

  (window as Window & { __testResult?: unknown }).__testResult = {
    detector,
    faceCount: faces.length,
    imagePath,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
  };
}

void main();
