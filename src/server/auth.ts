import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import * as crypto from "crypto";
import { db, hasDbConnection } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendVerificationEmail } from "@/server/email/resend";

if (!process.env.BETTER_AUTH_SECRET) {
  console.error(
    "[Auth] BETTER_AUTH_SECRET is not set. Auth will fail. " +
    "Add BETTER_AUTH_SECRET to .env.local (use: openssl rand -base64 32)"
  );
}

if (!process.env.BETTER_AUTH_URL) {
  console.warn(
    "[Auth] BETTER_AUTH_URL is not set. " +
    "Add BETTER_AUTH_URL to .env.local (e.g., http://localhost:3847)"
  );
}

if (!hasDbConnection()) {
  console.warn(
    "[Auth] No database URL found. Auth will fail at runtime. " +
    "Set POSTGRES_URL or DATABASE_URL in your environment."
  );
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function derToRaw(derSignature: Buffer): Buffer {
  let offset = 2;
  
  const rLength = derSignature[offset + 1];
  offset += 2;
  let r = derSignature.subarray(offset, offset + rLength);
  offset += rLength;
  
  const sLength = derSignature[offset + 1];
  offset += 2;
  let s = derSignature.subarray(offset, offset + sLength);
  
  if (r.length > 32) r = r.subarray(r.length - 32);
  if (s.length > 32) s = s.subarray(s.length - 32);
  
  const rPadded = Buffer.alloc(32);
  const sPadded = Buffer.alloc(32);
  r.copy(rPadded, 32 - r.length);
  s.copy(sPadded, 32 - s.length);
  
  return Buffer.concat([rPadded, sPadded]);
}

function generateAppleClientSecret(): string | null {
  const clientId = process.env.APPLE_CLIENT_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

  if (!clientId || !teamId || !keyId || !privateKeyRaw) {
    return null;
  }

  try {
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60 * 24 * 180; // 6 months

    const header = {
      alg: "ES256",
      kid: keyId,
    };

    const payload = {
      iss: teamId,
      iat: now,
      exp: exp,
      aud: "https://appleid.apple.com",
      sub: clientId,
    };

    const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;

    const sign = crypto.createSign("SHA256");
    sign.update(signingInput);
    sign.end();

    const derSignature = sign.sign(privateKey);
    const rawSignature = derToRaw(derSignature);
    const signatureB64 = base64UrlEncode(rawSignature);

    return `${signingInput}.${signatureB64}`;
  } catch (error) {
    console.error("[Auth] Failed to generate Apple client secret JWT:", error);
    return null;
  }
}

let cachedAppleSecret: string | null = null;

function getAppleClientSecret(): string | null {
  if (process.env.APPLE_CLIENT_SECRET) {
    return process.env.APPLE_CLIENT_SECRET;
  }

  if (cachedAppleSecret) {
    return cachedAppleSecret;
  }

  cachedAppleSecret = generateAppleClientSecret();
  return cachedAppleSecret;
}

const socialProviders: Parameters<typeof betterAuth>[0]["socialProviders"] = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
} else {
  console.warn("[Auth] Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
}

const appleClientId = process.env.APPLE_CLIENT_ID;
const appleSecret = getAppleClientSecret();

if (appleClientId && appleSecret) {
  socialProviders.apple = {
    clientId: appleClientId,
    clientSecret: appleSecret,
  };
  if (process.env.APPLE_CLIENT_SECRET) {
    console.log("[Auth] Apple Sign In configured with static client secret.");
  } else {
    console.log("[Auth] Apple Sign In configured with runtime JWT generation.");
  }
} else if (appleClientId) {
  console.warn("[Auth] Apple OAuth partially configured. Set APPLE_CLIENT_SECRET or (APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY).");
} else {
  console.warn("[Auth] Apple OAuth not configured. Set APPLE_CLIENT_ID + APPLE_CLIENT_SECRET or JWT config vars.");
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  socialProviders.facebook = {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    disableDefaultScope: true,
    scope: ["public_profile"],
  };
} else {
  console.warn("[Auth] Facebook OAuth not configured. Set FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET.");
}

// The app is served from several hosts at once (apex, www, demo, Vercel
// preview URLs, local dev), but a single static `baseURL` can only ever
// match one of them. better-auth signs its OAuth `state` and session
// cookies against `baseURL`'s origin, so a mismatched static baseURL made
// every other host fail OAuth with "state_mismatch" (or plain-auth with
// "Invalid origin") - the origin used to start the flow was never the
// origin used to validate it. `allowedHosts` resolves baseURL dynamically
// from each request's actual Host header instead, and better-auth derives
// trustedOrigins from the same list automatically.
export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "localhost:3847",
      "*.vercel.app",
      "www.freestocks.app",
      "freestocks.app",
      "demo.freestocks.app",
    ],
    fallback: process.env.BETTER_AUTH_URL || "http://localhost:3847",
  },
  trustedOrigins: ["https://appleid.apple.com"],
  account: {
    // Apple returns its OAuth callback via a cross-site POST
    // (response_mode=form_post), which the browser's SameSite=Lax cookie
    // policy strips - the extra state cookie check below never sees the
    // cookie and always fails with state_mismatch. The state's actual CSRF
    // protection is the signed value matched against the DB `verification`
    // row (see parseGenericState in better-auth), which is unaffected by
    // this flag - this only disables the redundant cookie check that
    // cross-site POST callbacks can't satisfy.
    skipStateCookieCheck: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: "freestocks",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
