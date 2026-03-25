import { ThemeProvider } from "@reusables/design-system";
import { AppMissingConfig } from "@/features/auth/AppMissingConfig";
import { SignedOutLanding } from "@/features/auth/SignedOutLanding";

export function App() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <ThemeProvider>
      {publishableKey ? <SignedOutLanding authMode="sign-in" onAuthModeChange={() => {}} /> : <AppMissingConfig />}
    </ThemeProvider>
  );
}
