import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { QA_BYPASS_COOKIE } from "@/lib/utils";

// Lets a tester reach the sign-up/sign-in flow on the real production
// domain (required for Google/Facebook OAuth, which only accept the
// exact registered redirect URI — not a Preview deployment's random
// URL) without exposing that flow to the public. The landing page
// itself stays untouched and world-readable in Coming Soon mode.
//
// Visiting /<QA_PATH_SEGMENT>, behind HTTP Basic Auth, sets a bypass
// cookie read by isComingSoon() (see lib/utils.ts) and redirects to
// /sign-in. Without QA_PATH_SEGMENT + SITE_PASSWORD both set, this
// middleware is a no-op.
const QA_PATH_SEGMENT = process.env.QA_PATH_SEGMENT;
const SITE_PASSWORD = process.env.SITE_PASSWORD;

function checkBasicAuth(request: NextRequest, password: string): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const separatorIndex = decoded.indexOf(":");
  const suppliedPassword = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);
  return suppliedPassword === password;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Freestocks QA"' },
  });
}

export function middleware(request: NextRequest) {
  if (!QA_PATH_SEGMENT || !SITE_PASSWORD) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname !== `/${QA_PATH_SEGMENT}`) {
    return NextResponse.next();
  }

  if (!checkBasicAuth(request, SITE_PASSWORD)) {
    return unauthorized();
  }

  const response = NextResponse.redirect(new URL("/sign-in", request.url));
  response.cookies.set(QA_BYPASS_COOKIE, "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
