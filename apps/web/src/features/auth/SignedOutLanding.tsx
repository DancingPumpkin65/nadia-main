import { MarketingNavbar } from "@reusables/design-system";

export function SignedOutLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar brand="NADIA." brandHref="/" items={[]} ctaLabel="Auth" ctaHref="#auth" />
      <div className="mx-auto max-w-5xl px-6 pt-28">
        <div className="border-2 border-[#1a1a1a] bg-[#f0f0e8] p-8">
          Staged auth and editor shell snapshot.
        </div>
      </div>
    </div>
  );
}
