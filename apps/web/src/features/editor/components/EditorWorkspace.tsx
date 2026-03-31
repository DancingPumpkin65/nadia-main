import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@reusables/design-system";
import { snapshotStep, stageFeatures } from "../snapshotStage";
import type { DisplayBox, FaceBox } from "../types";

type EditorWorkspaceProps = {
  sourceUrl: string | null;
  selectedFileName: string | undefined;
  processedLabel: string;
  faces: FaceBox[];
  manualFaces: FaceBox[];
  selectionPreview: DisplayBox | null;
  hasRenderableText: boolean;
  renderDescription: string;
  downloadUrl: string | null;
  originalImageRef: RefObject<HTMLImageElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onStartManualSelection: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onClearManualFaces: () => void;
  onCanvasMouseDown: (event: ReactMouseEvent<HTMLCanvasElement>) => void;
  getManualBoxStyle: (face: FaceBox) => React.CSSProperties | null;
};

function getFooterText() {
  if (stageFeatures.draggableText) {
    return "Drag the text rectangle on the rendered preview. Manual face selections are drawn on the original preview.";
  }

  if (stageFeatures.textOverlay) {
    return "Manual face selections stay on the original preview. The text rectangle is placed during render.";
  }

  if (stageFeatures.manualSelection) {
    return "Manual face selections are drawn on the original preview before rendering.";
  }

  if (snapshotStep === 10) {
    return "The rendered preview applies the selected masking mode to a fixed face box.";
  }

  if (snapshotStep === 9) {
    return "Original upload preview on the left, rendered canvas export on the right.";
  }

  return "The rendered preview applies browser-based face masking locally.";
}

export function EditorWorkspace({
  sourceUrl,
  selectedFileName,
  processedLabel,
  faces,
  manualFaces,
  selectionPreview,
  hasRenderableText,
  renderDescription,
  downloadUrl,
  originalImageRef,
  canvasRef,
  onStartManualSelection,
  onClearManualFaces,
  onCanvasMouseDown,
  getManualBoxStyle,
}: EditorWorkspaceProps) {
  return (
    <div className="grid gap-4">
      <Card className="bg-background">
        <CardHeader className="grid gap-4 md:grid-cols-2">
          <div>
            <Badge variant="secondary" className="w-fit">
              Original
            </Badge>
            <CardTitle className="mt-3">{selectedFileName ?? "No image selected"}</CardTitle>
          </div>
          <div>
            <Badge
              variant={faces.length > 0 ? "success" : hasRenderableText ? "warning" : "outline"}
              className="w-fit"
            >
              Rendered
            </Badge>
            <CardTitle className="mt-3">{processedLabel}</CardTitle>
            <CardDescription className="mt-2">{renderDescription}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          <div className="grid min-h-[540px] place-items-center border-2 border-[#1a1a1a] bg-[#e8e8e0] p-3">
            {sourceUrl ? (
              <div className="flex h-full w-full flex-col gap-3">
                {stageFeatures.manualSelection ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#666]">
                      Drag on the face here if auto-detect misses it.
                    </p>
                    <div className="flex items-center gap-2">
                      {manualFaces.length > 0 ? (
                        <Badge variant="warning" className="w-fit">
                          {manualFaces.length} manual
                        </Badge>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={manualFaces.length === 0}
                        onClick={onClearManualFaces}
                      >
                        Clear Manual Face
                      </Button>
                    </div>
                  </div>
                ) : null}
                <div className="grid flex-1 place-items-center">
                  <div
                    className={cn(
                      "relative inline-block select-none",
                      stageFeatures.manualSelection ? "cursor-crosshair" : "",
                    )}
                    onMouseDown={stageFeatures.manualSelection ? onStartManualSelection : undefined}
                  >
                    <img
                      ref={originalImageRef}
                      src={sourceUrl}
                      alt="Original preview"
                      draggable={false}
                      className="block max-h-[470px] max-w-full object-contain"
                    />
                    {stageFeatures.manualSelection ? (
                      <div className="pointer-events-none absolute inset-0">
                        {manualFaces.map((face, index) => {
                          const style = getManualBoxStyle(face);
                          if (!style) return null;

                          return (
                            <div
                              key={String(face.x) + "-" + String(face.y) + "-" + String(index)}
                              className="absolute border-2 border-dashed border-[#c26a1b] bg-[#f4b36a]/20"
                              style={style}
                            />
                          );
                        })}
                        {selectionPreview ? (
                          <div
                            className="absolute border-2 border-[#2d5a2d] bg-[#7bc47f]/20"
                            style={{
                              left: selectionPreview.x,
                              top: selectionPreview.y,
                              width: selectionPreview.width,
                              height: selectionPreview.height,
                            }}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <p className="max-w-xs text-center text-sm uppercase tracking-[0.14em] text-[#666]">
                Your original image will appear here.
              </p>
            )}
          </div>
          <div className="grid min-h-[540px] place-items-center border-2 border-[#1a1a1a] bg-[#e8e8e0] p-3">
            {sourceUrl ? (
              <canvas
                ref={canvasRef}
                className="max-h-[500px] max-w-full object-contain"
                onMouseDown={stageFeatures.draggableText ? onCanvasMouseDown : undefined}
              />
            ) : (
              <p className="max-w-xs text-center text-sm uppercase tracking-[0.14em] text-[#666]">
                Press render to generate the edited result.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#666]">
          {getFooterText()}
        </p>
        <Button
          asChild
          variant="primary"
          className={cn(!downloadUrl && "pointer-events-none opacity-40")}
        >
          <a href={downloadUrl ?? "#"} download="private-image.png">
            Download Result
          </a>
        </Button>
      </div>
    </div>
  );
}
