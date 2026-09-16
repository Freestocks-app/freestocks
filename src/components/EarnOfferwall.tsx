"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Zap, AlertTriangle, Wifi, Globe, RefreshCw, HelpCircle, Gamepad2, FileText } from "lucide-react";
import { CpxScriptWidget } from "./CpxScriptWidget";

export interface OfferwallProvider {
  id: string;
  name: string;
  type?: "iframe" | "cpx_script";
  url?: string;
  cpxAppId?: string;
  cpxSecureHash?: string;
}

interface EarnOfferwallProps {
  providers: OfferwallProvider[];
  userId: string;
}

type OfferwallState = "loading" | "loaded" | "slow" | "blocked" | "error";

function LoadingSkeleton() {
  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 rounded-xl bg-cta/10 border border-cta/20 flex items-center justify-center mb-4">
          <Zap className="w-6 h-6 text-cta animate-pulse" />
        </div>
        <p className="font-medium text-sm mb-1">Loading offers...</p>
        <p className="text-xs text-muted">This may take a few seconds</p>
        
        <div className="mt-8 grid grid-cols-3 gap-3 w-full max-w-md">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-lg bg-elevated border border-border animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SlowState({ onRetry, onWait }: { onRetry: () => void; onWait: () => void }) {
  return (
    <div className="absolute inset-0 bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-elevated border border-border flex items-center justify-center mb-4">
        <Wifi className="w-6 h-6 text-muted" />
      </div>
      <h3 className="font-semibold mb-1">Taking longer than usual</h3>
      <p className="text-sm text-muted max-w-xs mb-4">
        Offers are still loading. This could be a slow connection.
      </p>
      <div className="flex gap-2">
        <button onClick={onWait} className="btn-secondary text-sm py-2 px-4">
          Keep Waiting
        </button>
        <button onClick={onRetry} className="btn-primary text-sm py-2 px-4">
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}

function BlockedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-elevated border border-border flex items-center justify-center mb-4">
        <Globe className="w-6 h-6 text-muted" />
      </div>
      <h3 className="font-semibold mb-1">Offers unavailable</h3>
      <p className="text-sm text-muted max-w-xs mb-4">
        May be blocked by VPN, ad-blocker, or region.
      </p>
      
      <div className="card p-3 max-w-xs w-full mb-4 text-left">
        <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cta" />
          Try:
        </p>
        <ul className="text-xs text-muted space-y-1">
          <li>• Disable VPN/proxy</li>
          <li>• Turn off ad-blocker</li>
          <li>• Try mobile data</li>
        </ul>
      </div>
      
      <button onClick={onRetry} className="btn-primary text-sm py-2 px-4">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-elevated border border-border flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-muted" />
      </div>
      <h3 className="font-semibold mb-1">Something went wrong</h3>
      <p className="text-sm text-muted max-w-xs mb-4">
        Couldn&apos;t load offers. Please try again.
      </p>
      <button onClick={onRetry} className="btn-primary text-sm py-2 px-4">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

function getTabIcon(name: string) {
  if (name.toLowerCase() === "game") return Gamepad2;
  if (name.toLowerCase() === "survey") return FileText;
  return Zap;
}

function ProviderTabs({
  providers,
  activeProvider,
  onSelect,
}: {
  providers: OfferwallProvider[];
  activeProvider: string;
  onSelect: (id: string) => void;
}) {
  if (providers.length <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 p-1 bg-elevated/50 rounded-full border border-border max-w-xs mx-auto">
      {providers.map((provider) => {
        const Icon = getTabIcon(provider.name);
        const isActive = activeProvider === provider.id;
        return (
          <button
            key={provider.id}
            onClick={() => onSelect(provider.id)}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[40px] ${
              isActive
                ? "bg-cta text-cta-ink shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{provider.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EarnOfferwall(props: EarnOfferwallProps) {
  return (
    <Suspense fallback={null}>
      <EarnOfferwallInner {...props} />
    </Suspense>
  );
}

function EarnOfferwallInner({ providers, userId }: EarnOfferwallProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const initialProvider = providers.find((p) => p.id === tabParam)?.id || providers[0]?.id || "";

  const [activeProvider, setActiveProvider] = useState(initialProvider);
  const [state, setState] = useState<OfferwallState>("loading");
  const [key, setKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const extendedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentProvider = providers.find((p) => p.id === activeProvider);

  const currentIsIframe = (currentProvider?.type ?? "iframe") === "iframe";

  useEffect(() => {
    if (!currentIsIframe) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (extendedTimeoutRef.current) clearTimeout(extendedTimeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setState((prev) => prev === "loading" ? "slow" : prev);
    }, 10000);

    extendedTimeoutRef.current = setTimeout(() => {
      setState((prev) => prev === "loading" || prev === "slow" ? "blocked" : prev);
    }, 30000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (extendedTimeoutRef.current) clearTimeout(extendedTimeoutRef.current);
    };
  }, [key, activeProvider, currentIsIframe]);

  const handleLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (extendedTimeoutRef.current) clearTimeout(extendedTimeoutRef.current);
    setState("loaded");
  };

  const handleError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (extendedTimeoutRef.current) clearTimeout(extendedTimeoutRef.current);
    setState("error");
  };

  const handleRetry = () => {
    setState("loading");
    setKey((k) => k + 1);
  };

  const handleKeepWaiting = () => {
    setState("loading");
    if (extendedTimeoutRef.current) clearTimeout(extendedTimeoutRef.current);
    extendedTimeoutRef.current = setTimeout(() => {
      setState((prev) => prev === "loading" ? "blocked" : prev);
    }, 20000);
  };

  const handleProviderChange = (id: string) => {
    setState("loading");
    setActiveProvider(id);
    setKey((k) => k + 1);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!currentProvider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] px-6 text-center">
        <div className="w-14 h-14 rounded-xl bg-cta/10 border border-cta/20 flex items-center justify-center mb-4">
          <Zap className="w-7 h-7 text-cta" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Offers Coming Soon</h2>
        <p className="text-muted text-sm max-w-xs">
          Check back shortly for surveys, apps, and games.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-12rem)] md:min-h-[calc(100vh-10rem)]">
      {/* Game/Survey tabs - FreeCash style */}
      {providers.length > 1 && (
        <div className="px-4 py-3 bg-bg">
          <ProviderTabs
            providers={providers}
            activeProvider={activeProvider}
            onSelect={handleProviderChange}
          />
        </div>
      )}
      
      {/* Offer content */}
      <div className="relative flex-1">
        {currentProvider.type === "cpx_script" ? (
          <CpxScriptWidget
            key={activeProvider}
            appId={currentProvider.cpxAppId || ""}
            userId={userId}
            secureHash={currentProvider.cpxSecureHash}
          />
        ) : (
          <>
            {state === "loading" && <LoadingSkeleton />}
            {state === "slow" && <SlowState onRetry={handleRetry} onWait={handleKeepWaiting} />}
            {state === "blocked" && <BlockedState onRetry={handleRetry} />}
            {state === "error" && <ErrorState onRetry={handleRetry} />}

            <iframe
              key={`${activeProvider}-${key}`}
              src={currentProvider.url}
              className={`w-full h-full min-h-[calc(100vh-14rem)] md:min-h-[calc(100vh-12rem)] border-0 transition-opacity duration-300 ${
                state === "loaded" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              allow="clipboard-write"
              title="Offers"
              onLoad={handleLoad}
              onError={handleError}
            />
          </>
        )}
      </div>
    </div>
  );
}
