import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Gates the whole production site behind HTTP Basic Auth while we test
// OAuth (Google/Facebook) against the real production domain, which is
// the only domain those providers' redirect URIs are registered for.
// Set SITE_PASSWORD in the Production env to enable; unset disables the
// gate entirely (Preview/Development stay open).
export function middleware(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf-8");
      const separatorIndex = decoded.indexOf(":");
      const password = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);
      if (password === sitePassword) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Freestocks"' },
  });
}

export const config = {
  matcher: [
    // Run on everything except static assets, Next.js internals,
    // /api/auth/* (better-auth's OAuth callback — a redirect from the
    // provider carries no Basic Auth header and would 401 before
    // better-auth ever sees it), and the offer-wall webhook callbacks
    // (server-to-server, HMAC-verified, carry no browser credentials).
    "/((?!_next/static|_next/image|favicon.png|apple-touch-icon.png|assets/|brand/|api/auth/|api/bitlabs/callback|api/ayet/callback).*)",
  ],
};
