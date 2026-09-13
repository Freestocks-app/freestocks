"use client";

import { PrivyProvider as BasePrivyProvider } from "@privy-io/react-auth";

interface PrivyProviderProps {
  children: React.ReactNode;
  appId: string;
}

export function PrivyProvider({ children, appId }: PrivyProviderProps) {
  return (
    <BasePrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "dark",
          accentColor: "#d4fc50",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
          ethereum: {
            createOnLogin: "off",
          },
        },
      }}
    >
      {children}
    </BasePrivyProvider>
  );
}
