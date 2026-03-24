import { SignUp } from "@clerk/react";
import { clerkAppearance } from "./clerkAppearance";

export function SignUpCard({
  redirectUrl = "/dashboard",
}: {
  redirectUrl?: string;
}) {
  return (
    <SignUp
      fallbackRedirectUrl={redirectUrl}
      appearance={clerkAppearance}
    />
  );
}
