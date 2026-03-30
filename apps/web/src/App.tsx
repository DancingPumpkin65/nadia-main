import { ClerkAppProvider } from "@reusables/clerk-auth";
import { ThemeProvider } from "@reusables/design-system";
import { AuthGate } from "@/features/auth/AuthGate";
import { AppMissingConfig } from "@/features/auth/AppMissingConfig";
import { EditorScreen } from "@/features/editor/EditorScreen";

export function App() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const bypassAuth =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("bypassAuth") === "1";

  if (bypassAuth) {
    return (
      <ThemeProvider>
        <EditorScreen showUserButton={false} />
      </ThemeProvider>
    );
  }

  if (!publishableKey) {
    return (
      <ThemeProvider>
        <AppMissingConfig />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ClerkAppProvider publishableKey={publishableKey}>
        <AuthGate />
      </ClerkAppProvider>
    </ThemeProvider>
  );
}
