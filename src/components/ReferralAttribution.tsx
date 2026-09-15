"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Fires a best-effort, idempotent referral-attribution call when the user
 * lands on /earn with a ?ref=CODE param (set on the signup callbackURL).
 * Renders nothing. Never surfaces an error — a failed/invalid code should
 * never disrupt onboarding.
 */
export function ReferralAttribution() {
  return (
    <Suspense fallback={null}>
      <ReferralAttributionInner />
    </Suspense>
  );
}

function ReferralAttributionInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    const code = searchParams.get("ref");
    if (!code || fired.current) return;
    fired.current = true;

    fetch("/api/referral/attribute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {
      // best-effort; ignore failures
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ref");
    const query = params.toString();
    router.replace(query ? `/earn?${query}` : "/earn");
  }, [searchParams, router]);

  return null;
}
