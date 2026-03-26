import { DashboardNavbar } from "@reusables/design-system";

export function EditorScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardNavbar brand="NADIA." brandHref="/" paths={[{ label: "Editor" }]} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="border-2 border-[#1a1a1a] bg-[#f0f0e8] p-8">Signed-in editor shell snapshot.</div>
      </div>
    </div>
  );
}
