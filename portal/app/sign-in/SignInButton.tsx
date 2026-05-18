"use client";
import * as React from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export function SignInButton({ next }: { next?: string }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signIn.oauth2({
          providerId: "authentik",
          callbackURL: next ?? "/",
          errorCallbackURL: "/sign-in?error=oauth",
        });
        // setBusy(false) — redirect occurs, no need
      }}
    >
      {busy ? <Loader2 className="animate-spin" /> : <LogIn />}
      Continue with Authentik
    </Button>
  );
}
