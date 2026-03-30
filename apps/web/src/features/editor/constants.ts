import type { EditorState } from "./types";

export const initialEditorState: EditorState = {
  mode: "pixelate",
  textEnabled: false,
  overlayText: "",
  textX: 80,
  textY: 80,
  textSize: 34,
  textPadding: 18,
  boxColor: "#111111",
  textColor: "#f7efe4",
};

export const initialDetectorMessage = "Face detection runs locally in your browser.";
