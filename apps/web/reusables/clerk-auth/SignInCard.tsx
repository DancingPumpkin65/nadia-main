import { SignIn } from "@clerk/react";
import { clerkAppearance } from "./clerkAppearance";

export function SignInCard({
  redirectUrl = "/dashboard",
}: {
  redirectUrl?: string;
}) {
  return (
    <SignIn
      fallbackRedirectUrl={redirectUrl}
      appearance={clerkAppearance}
    />
  );
}
