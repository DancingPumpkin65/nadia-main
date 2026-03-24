import { ClerkProvider } from "@clerk/react";
import { type ReactNode } from "react";

export function ClerkAppProvider({
  publishableKey,
  children,
}: {
  publishableKey: string;
  children: ReactNode;
}) {
  return <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>;
}
