import {
  FaceDetector as MediaPipeFaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";
import { useRef } from "react";
import {
  createScaledDetectionInput,
  expandFaceBox,
  rescaleFaceBox,
} from "./canvas";
import type { FaceBox } from "./types";

const detectionScales = [1, 1.25, 1.5, 1.85, 2.2, 0.85];

function useFaceModel() {
  const modelRef = useRef<Promise<blazeface.BlazeFaceModel> | null>(null);

  return async () => {
    if (!modelRef.current) {
      modelRef.current = (async () => {
        await tf.ready();
        if (tf.getBackend() !== "webgl") {
          try {
            await tf.setBackend("webgl");
            await tf.ready();
          } catch {
            await tf.ready();
          }
        }
        return blazeface.load();
      })();
    }
    return modelRef.current;
  };
}

function useMediaPipeFaceDetector() {
  const detectorRef = useRef<Promise<MediaPipeFaceDetector> | null>(null);

  return async () => {
    if (!detectorRef.current) {
      detectorRef.current = (async () => {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm",
        );

        return MediaPipeFaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "IMAGE",
        });
      })();
    }

    return detectorRef.current;
  };
}

export function useFaceDetector() {
  const loadFaceModel = useFaceModel();
  const loadMediaPipeDetector = useMediaPipeFaceDetector();

  return async (image: HTMLImageElement) => {
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;

    const runBlazeFace = async (input: HTMLImageElement | HTMLCanvasElement) => {
      const model = await loadFaceModel();
      const predictions = await model.estimateFaces(input, false);
      return predictions.map((prediction) => {
        const [x1, y1] = prediction.topLeft as [number, number];
        const [x2, y2] = prediction.bottomRight as [number, number];
        return {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
        };
      });
    };

    const FaceDetectorCtor = (
      window as Window & {
        FaceDetector?: new (options: {
          fastMode: boolean;
          maxDetectedFaces: number;
        }) => {
          detect(
            input: HTMLImageElement | HTMLCanvasElement,
          ): Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
        };
      }
    ).FaceDetector;

    const runNativeFaceDetector = async (input: HTMLImageElement | HTMLCanvasElement) => {
      if (!FaceDetectorCtor) return [];

      const detector = new FaceDetectorCtor({
        fastMode: true,
        maxDetectedFaces: 10,
      });
      const results = await detector.detect(input);
      return results.map((result) => {
        const { x, y, width, height } = result.boundingBox;
        return { x, y, width, height };
      });
    };

    const tryAcrossScales = async (
      label: string,
      detector: (input: HTMLImageElement | HTMLCanvasElement) => Promise<FaceBox[]>,
    ) => {
      for (const requestedScale of detectionScales) {
        const { input, appliedScale } = createScaledDetectionInput(image, requestedScale);
        try {
          const facesAtScale = await detector(input);
          if (!facesAtScale.length) continue;

          const rawFaces = facesAtScale.map((face) =>
            rescaleFaceBox(face, appliedScale, imageWidth, imageHeight),
          );
          const scaleSuffix =
            appliedScale === 1 ? "" : ` at ${appliedScale.toFixed(2)}x scale`;
          return {
            faces: rawFaces.map((prediction) =>
              expandFaceBox(prediction, imageWidth, imageHeight),
            ),
            message: `Using ${label} locally in the browser${scaleSuffix}.`,
          };
        } catch {
          continue;
        }
      }

      return null;
    };

    const detectorPasses = [
      {
        label: "MediaPipe",
        detector: async (input: HTMLImageElement | HTMLCanvasElement) => {
          const mediaPipeDetector = await loadMediaPipeDetector();
          const result = mediaPipeDetector.detect(input);
          return result.detections
            .filter((detection) => Boolean(detection.boundingBox))
            .map((detection) => ({
              x: detection.boundingBox!.originX,
              y: detection.boundingBox!.originY,
              width: detection.boundingBox!.width,
              height: detection.boundingBox!.height,
            }));
        },
      },
      {
        label: "BlazeFace",
        detector: runBlazeFace,
      },
      {
        label: "FaceDetector",
        detector: runNativeFaceDetector,
      },
    ] as const;

    for (const pass of detectorPasses) {
      const result = await tryAcrossScales(pass.label, pass.detector);
      if (result?.faces.length) {
        return result;
      }
    }

    return {
      faces: [],
      message:
        "No face detected automatically yet. Drag over the face on the original preview to add a manual fallback.",
    };
  };
}
