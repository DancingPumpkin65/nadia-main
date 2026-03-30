export type Mode = "pixelate" | "blur";

export type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DisplayBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextRect = FaceBox & {
  lines: string[];
  padding: number;
  fontSize: number;
  boxColor: string;
  textColor: string;
  lineHeight: number;
};

export type EditorState = {
  mode: Mode;
  textEnabled: boolean;
  overlayText: string;
  textX: number;
  textY: number;
  textSize: number;
  textPadding: number;
  boxColor: string;
  textColor: string;
};
