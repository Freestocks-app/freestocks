"use client";

import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

const CPX_SCRIPT_SRC = "https://cdn.cpx-research.com/assets/js/script_tag_v2.0.js";
const DIV_ID = "cpx-offerwall-fullscreen";

interface CpxScriptWidgetProps {
  appId: string;
  userId: string;
  secureHash?: string;
}

declare global {
  interface Window {
    config?: Record<string, unknown>;
  }
}

function scriptAlreadyLoaded(): boolean {
  return typeof document !== "undefined" && !!document.querySelector(`script[src="${CPX_SCRIPT_SRC}"]`);
}

export function CpxScriptWidget({ appId, userId, secureHash }: CpxScriptWidgetProps) {
  const [loaded, setLoaded] = useState(scriptAlreadyLoaded);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generalConfig: Record<string, unknown> = {
      app_id: Number(appId),
      ext_user_id: userId,
    };
    if (secureHash) {
      generalConfig.secure_hash = secureHash;
    }

    window.config = {
      general_config: generalConfig,
      script_config: [
        {
          div_id: DIV_ID,
          theme_style: 1,
        },
      ],
    };

    if (scriptAlreadyLoaded()) {
      return;
    }

    const script = document.createElement("script");
    script.src = CPX_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
  }, [appId, userId, secureHash]);

  return (
    <div className="relative min-h-[calc(100vh-14rem)] md:min-h-[calc(100vh-12rem)]">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-cta/10 border border-cta/20 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-cta animate-pulse" />
          </div>
          <p className="font-medium text-sm mb-1">Loading surveys...</p>
        </div>
      )}
      <div id={DIV_ID} ref={containerRef} className="w-full" />
    </div>
  );
}
