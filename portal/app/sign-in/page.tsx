import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth, ssoConfigured } from "@/lib/auth";
import { SignInButton } from "./SignInButton";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null);
  if (session) redirect(sp.next ?? "/");

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-accent/30 bg-accent/10 text-[hsl(var(--accent))]">
            <span className="font-mono text-[12px] font-semibold">L</span>
          </span>
          <div>
            <div className="text-[14px] font-semibold tracking-tight">
              patchway
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              upgrade hub
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border bg-subtle/60 p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            authentication required
          </div>
          <h1 className="mt-1.5 text-[20px] font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Authenticate through Authentik. Access is gated by the policies
            bound to this application in your Authentik instance.
          </p>

          <div className="mt-6">
            {ssoConfigured ? (
              <SignInButton next={sp.next} />
            ) : (
              <div className="rounded-md border border-warn/30 bg-warn/5 p-3">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-[hsl(var(--warn))]">
                  authentik not configured
                </div>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Set <code className="font-mono">OAUTH_ISSUER</code>,{" "}
                  <code className="font-mono">OAUTH_CLIENT_ID</code>, and{" "}
                  <code className="font-mono">OAUTH_CLIENT_SECRET</code>, then
                  restart. See <code className="font-mono">.env.example</code>{" "}
                  for the Authentik issuer URL format.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
          authentik callback · /api/auth/oauth2/callback/authentik
        </p>
      </div>
    </div>
  );
}
