import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./schema";

const ISSUER = process.env.OAUTH_ISSUER;
const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const SCOPES = (process.env.OAUTH_SCOPES ?? "openid email profile").split(/\s+/);

if (!process.env.BETTER_AUTH_SECRET && process.env.NODE_ENV === "production") {
  console.warn("[auth] BETTER_AUTH_SECRET is not set — sessions will not be stable across restarts.");
}

export const ssoConfigured = Boolean(ISSUER && CLIENT_ID && CLIENT_SECRET);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-only-secret-change-me",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  session: {
    expiresIn: 60 * 60 * 24 * 7,    // 7 days
    updateAge: 60 * 60 * 24,        // refresh once a day
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  plugins: ssoConfigured
    ? [
        genericOAuth({
          config: [
            {
              // Authentik. The OIDC issuer URL for an Authentik provider is:
              //   https://<authentik-host>/application/o/<application-slug>/
              // We append /.well-known/openid-configuration ourselves.
              providerId: "authentik",
              clientId: CLIENT_ID!,
              clientSecret: CLIENT_SECRET!,
              discoveryUrl: `${ISSUER!.replace(/\/$/, "")}/.well-known/openid-configuration`,
              scopes: SCOPES,
              pkce: true,
              // Authentik exposes email/name/picture under the standard OIDC userinfo claims.
              mapProfileToUser: (profile: any) => ({
                id: profile.sub,
                email: profile.email,
                emailVerified: profile.email_verified ?? true,
                name: profile.name ?? profile.preferred_username ?? profile.email,
                image: profile.picture ?? null,
              }),
            },
          ],
        }),
      ]
    : [],
});

export type Session = typeof auth.$Infer.Session;
