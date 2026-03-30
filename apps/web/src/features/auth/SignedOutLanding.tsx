import { SignInCard, SignUpCard } from "@reusables/clerk-auth";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MarketingNavbar,
  ThemeIconButton,
  useTheme,
} from "@reusables/design-system";

type AuthMode = "sign-in" | "sign-up";

export function SignedOutLanding({
  authMode,
  onAuthModeChange,
}: {
  authMode: AuthMode;
  onAuthModeChange: (mode: AuthMode) => void;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar
        brand="NADIA."
        brandHref="/"
        items={[
          { label: "Private Masking", href: "#features", hiddenOnMobile: true },
          { label: "Manual Fallback", href: "#features", hiddenOnMobile: true },
        ]}
        utilitySlot={<ThemeIconButton theme={theme} onToggle={toggleTheme} />}
        ctaLabel="Open Auth"
        ctaHref="#auth-card"
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 pt-28 xl:grid-cols-[minmax(0,1.1fr)_420px]">
        <Card className="bg-background">
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              Reusable System
            </Badge>
            <CardTitle className="max-w-3xl text-4xl font-black uppercase tracking-[-0.08em] md:text-6xl">
              Face privacy editing with the updated navbar and theme controls.
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm">
              The app now uses the reusable navbar pattern, the icon-based light and dark toggle,
              local face masking, manual fallback selection, and auto-sized text overlays.
            </CardDescription>
          </CardHeader>
          <CardContent id="features" className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  Auto
                </Badge>
                <CardTitle>Multi-scale passes</CardTitle>
                <CardDescription>
                  The browser retries several detection scales before falling back.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Badge variant="warning" className="w-fit">
                  Backup
                </Badge>
                <CardTitle>Manual face selection</CardTitle>
                <CardDescription>
                  Drag over the face on the original preview when auto-detect misses.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Badge variant="success" className="w-fit">
                  Overlay
                </Badge>
                <CardTitle>Text rectangle</CardTitle>
                <CardDescription>
                  Add auto-sized text blocks and drag them on the final render.
                </CardDescription>
              </CardHeader>
            </Card>
          </CardContent>
        </Card>

        <div className="xl:pt-10">
          <Card id="auth-card" className="w-full max-w-md">
            <CardHeader>
              <Badge variant="success" className="w-fit">
                Browser Editor
              </Badge>
              <CardTitle>{authMode === "sign-in" ? "Sign in" : "Create your account"}</CardTitle>
              <CardDescription>
                Use the reusable Clerk auth flow to open the in-browser face privacy editor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={authMode === "sign-in" ? "primary" : "outline"}
                  className="flex-1"
                  onClick={() => onAuthModeChange("sign-in")}
                >
                  Sign In
                </Button>
                <Button
                  variant={authMode === "sign-up" ? "primary" : "outline"}
                  className="flex-1"
                  onClick={() => onAuthModeChange("sign-up")}
                >
                  Sign Up
                </Button>
              </div>
              {authMode === "sign-in" ? (
                <SignInCard redirectUrl="/" />
              ) : (
                <SignUpCard redirectUrl="/" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
