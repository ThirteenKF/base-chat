'use client';

import React, { ReactNode } from "react";
import { baseSepolia } from "wagmi/chains";
import { createConfig, WagmiProvider, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  ssr: true,
  multiInjectedProviderDiscovery: true,
  transports: {
    [baseSepolia.id]: http("https://sepolia.base.org"),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}