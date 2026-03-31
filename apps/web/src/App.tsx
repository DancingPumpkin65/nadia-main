import { ClerkAppProvider } from "@reusables/clerk-auth";
import { ThemeProvider } from "@reusables/design-system";
import { AuthGate } from "@/features/auth/AuthGate";
import { AppMissingConfig } from "@/features/auth/AppMissingConfig";

export function App() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
