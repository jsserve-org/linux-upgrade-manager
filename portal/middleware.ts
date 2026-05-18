import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that NEVER require auth (even when SSO is configured).
const PUBLIC_PREFIXES = [
  "/sign-in",
  "/api/auth",          // better-auth handler (must be reachable to sign in)
  "/api/agent",         // bearer-token authed (per-host)
  "/api/install",       // binary downloads (used by the install script)
  "/api/health",        // health check endpoint
  "/install.sh",        // installer script
  "/_next",
  "/favicon",
];

// Dev mode: if no SSO env is set, the hub runs without auth.
const ssoConfigured = Boolean(
  process.env.OAUTH_ISSUER &&
    process.env.OAUTH_CLIENT_ID &&
    process.env.OAUTH_CLIENT_SECRET
);

export function middleware(req: NextRequest) {
  if (!ssoConfigured) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (
    PUBLIC_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    )
  ) {
    return NextResponse.next();
  }
  const cookie = getSessionCookie(req);
  if (!cookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname + (req.nextUrl.search ?? ""));
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
