import type { NextConfig } from "next";

// Privy production checklist: CSP protects the embedded wallet iframe,
// frame-ancestors 'none' + X-Frame-Options DENY stop this site itself
// from being framed (clickjacking).
// https://docs.privy.io/security/implementation-guide/content-security-policy
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Next.js App Router streams RSC payloads via inline <script> tags, so
  // 'unsafe-inline' is required here unless a nonce-based middleware is
  // added; this CSP's real job (per Privy's checklist) is locking down
  // frame-src/frame-ancestors around the embedded wallet, not hardening
  // script-src to nonce-level strictness.
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // offerwall.ayet.io and web.bitlabs.ai are embedded as offer-wall
  // iframes in the earn flow; auth.privy.io is the embedded wallet.
  "child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://offerwall.ayet.io https://web.bitlabs.ai",
  "frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com https://offerwall.ayet.io https://web.bitlabs.ai",
  "connect-src 'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com https://api.dexscreener.com",
  "worker-src 'self'",
  "manifest-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
