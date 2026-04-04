import { UserButton } from "@clerk/react";
import {
  Badge,
  Card,
  CardContent,
  DashboardNavbar,
  ThemeIconButton,
  useTheme,
} from "@reusables/design-system";
import { EditorControls } from "./components/EditorControls";
import { EditorWorkspace } from "./components/EditorWorkspace";
import { useFacePrivacyEditor } from "./useFacePrivacyEditor";

export function EditorScreen({ showUserButton = true }: { showUserButton?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const editor = useFacePrivacyEditor();

  return (
    <div className="min-h-screen bg-background px-4 py-5 text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <DashboardNavbar
          brand="NADIA."
          brandHref="/"
          paths={[{ label: "Face Privacy Studio" }]}
          utilitySlot={
            <>
              <ThemeIconButton theme={theme} onToggle={toggleTheme} />
            </>
          }
          actionSlot={
            showUserButton ? (
              <div className="flex h-10 items-center border-2 border-[#1a1a1a] bg-[#e8e8e0] px-3">
                <UserButton />
              </div>
            ) : (
              <Badge variant="outline" className="w-fit">
                Local Preview
              </Badge>
            )
          }
        />

        <Card className="bg-background">
          <CardContent className="flex flex-col gap-3 p-5">
            <Badge variant="success" className="w-fit">
              Authenticated Editor
            </Badge>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-[-0.08em] text-[#1a1a1a] md:text-6xl">
                Face Privacy Studio
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#666]">
                Rebuilt with the reusable dashboard navbar, theme icons, Clerk auth, and the browser-only privacy editor flow.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <EditorControls
            selectedFile={editor.selectedFile}
            editorState={editor.editorState}
            detectorMessage={editor.detectorMessage}
            status={editor.status}
            isRendering={editor.isRendering}
            onFileChange={editor.handleFileChange}
            onUpdateState={editor.updateEditorState}
            onRender={() => void editor.renderImage()}
            onResetTextPosition={editor.resetTextPosition}
          />

          <EditorWorkspace
            sourceUrl={editor.sourceUrl}
            selectedFileName={editor.selectedFile?.name}
            processedLabel={editor.processedLabel}
            faces={editor.faces}
            manualFaces={editor.manualFaces}
            selectionPreview={editor.selectionPreview}
            hasRenderableText={editor.hasRenderableText}
            renderDescription={editor.renderDescription}
            downloadUrl={editor.downloadUrl}
            originalImageRef={editor.originalImageRef}
            canvasRef={editor.canvasRef}
            onStartManualSelection={editor.startManualSelection}
            onClearManualFaces={editor.clearManualFaces}
            onCanvasMouseDown={editor.handleCanvasMouseDown}
            getManualBoxStyle={editor.getManualBoxStyle}
          />
        </div>
      </div>
    </div>
  );
}
