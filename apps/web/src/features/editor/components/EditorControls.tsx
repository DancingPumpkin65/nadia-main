import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  cn,
} from "@reusables/design-system";
import type { EditorState } from "../types";

type EditorControlsProps = {
  selectedFile: File | null;
  editorState: EditorState;
  detectorMessage: string;
  status: string;
  isRendering: boolean;
  onFileChange: (file: File | null) => void;
  onUpdateState: (patch: Partial<EditorState>) => void;
  onRender: () => void;
  onResetTextPosition: () => void;
};

export function EditorControls({
  selectedFile,
  editorState,
  detectorMessage,
  status,
  isRendering,
  onFileChange,
  onUpdateState,
  onRender,
  onResetTextPosition,
}: EditorControlsProps) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <Badge variant="outline" className="w-fit">
          Controls
        </Badge>
        <CardTitle>Simplified Editor</CardTitle>
        <CardDescription>
          One upload flow, one render action, and an auto-sized text rectangle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
            Image
          </label>
          <label className="flex cursor-pointer flex-col gap-2 border-2 border-dashed border-[#1a1a1a] bg-[#e8e8e0] p-4 text-[#1a1a1a]">
            <span className="font-serif text-2xl font-black">Choose an Image</span>
            <span className="text-xs uppercase tracking-[0.16em] text-[#666]">
              {selectedFile ? selectedFile.name : "The file stays in your browser while editing"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
            Face Mask
          </label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={editorState.mode === "pixelate" ? "primary" : "outline"}
              className="flex-1"
              onClick={() => onUpdateState({ mode: "pixelate" })}
            >
              Pixelate
            </Button>
            <Button
              type="button"
              variant={editorState.mode === "blur" ? "primary" : "outline"}
              className="flex-1"
              onClick={() => onUpdateState({ mode: "blur" })}
            >
              Blur
            </Button>
          </div>
          <p className="text-xs uppercase tracking-[0.14em] text-[#666]">{detectorMessage}</p>
          <p className="text-xs uppercase tracking-[0.14em] text-[#8b5e34]">
            If auto-detect misses, drag over the face on the original preview.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
              Text Rectangle
            </label>
            <Button
              type="button"
              size="sm"
              variant={editorState.textEnabled ? "primary" : "outline"}
              onClick={() => onUpdateState({ textEnabled: !editorState.textEnabled })}
            >
              {editorState.textEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <textarea
            value={editorState.overlayText}
            onChange={(event) => onUpdateState({ overlayText: event.target.value })}
            rows={4}
            className={cn(
              "min-h-28 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] px-3 py-2 text-sm font-mono text-[#1a1a1a] outline-none transition-all placeholder:text-[#888] focus:border-[#2d5a2d] focus:shadow-[4px_4px_0px_0px_var(--shadow-accent)]",
            )}
            placeholder={"Spring drop\nAvailable now"}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
                X
              </label>
              <Input
                type="number"
                value={editorState.textX}
                onChange={(event) => onUpdateState({ textX: Number(event.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
                Y
              </label>
              <Input
                type="number"
                value={editorState.textY}
                onChange={(event) => onUpdateState({ textY: Number(event.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
                Font Size
              </label>
              <Input
                type="number"
                value={editorState.textSize}
                onChange={(event) => onUpdateState({ textSize: Number(event.target.value) || 34 })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
                Padding
              </label>
              <Input
                type="number"
                value={editorState.textPadding}
                onChange={(event) =>
                  onUpdateState({ textPadding: Number(event.target.value) || 18 })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
                Box Color
              </label>
              <input
                type="color"
                value={editorState.boxColor}
                onChange={(event) => onUpdateState({ boxColor: event.target.value })}
                className="h-12 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] p-1"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#444]">
                Text Color
              </label>
              <input
                type="color"
                value={editorState.textColor}
                onChange={(event) => onUpdateState({ textColor: event.target.value })}
                className="h-12 w-full border-2 border-[#1a1a1a] bg-[#f0f0e8] p-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full"
            variant="primary"
            disabled={!selectedFile || isRendering}
            onClick={onRender}
          >
            {isRendering ? "Rendering..." : "Render"}
          </Button>
          <Button
            className="w-full"
            variant="outline"
            disabled={isRendering}
            onClick={onResetTextPosition}
          >
            Reset Text Position
          </Button>
          <p className="text-xs uppercase tracking-[0.14em] text-[#666]">{status}</p>
        </div>
      </CardContent>
    </Card>
  );
}
