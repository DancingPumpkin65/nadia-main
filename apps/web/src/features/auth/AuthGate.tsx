import { Show } from "@clerk/react";
import { useState } from "react";
import { EditorScreen } from "@/features/editor/EditorScreen";
import { SignedOutLanding } from "./SignedOutLanding";

type AuthMode = "sign-in" | "sign-up";

export function AuthGate() {
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");

  return (
    <>
      <Show when="signed-out">
        <SignedOutLanding authMode={authMode} onAuthModeChange={setAuthMode} />
      </Show>
      <Show when="signed-in">
        <EditorScreen />
      </Show>
    </>
  );
}
