'use client';

import React, { ReactNode } from "react";
import { baseSepolia } from "wagmi/chains";
import { createConfig, WagmiProvider, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  // Fast connect for injected wallets (Rabby, MetaMask, etc.)
  // - avoid EIP-6963 multi-provider discovery overhead unless you need a wallet picker
  // - reduce async injection wait time (defaults can feel "slow" on first connect)
  connectors: [
    injected({
      unstable_shimAsyncInject: 200,
    }),
  ],
  ssr: false,
  multiInjectedProviderDiscovery: false,
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