"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createCDPEmbeddedWalletConnector,
} from "@coinbase/cdp-wagmi";
import { http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { skaleSupportedChains } from "@/lib/skale";

const queryClient = new QueryClient();
const cdpProjectId =
  process.env.NEXT_PUBLIC_CDP_PROJECT_ID ?? "cdp-project-id-required";

const transports = Object.fromEntries(
  skaleSupportedChains.map((chain) => [chain.id, http(chain.rpcUrls.default.http[0])]),
) as Record<number, ReturnType<typeof http>>;

const connectors =
  typeof window === "undefined"
    ? []
    : [
        createCDPEmbeddedWalletConnector({
          cdpConfig: {
            projectId: cdpProjectId,
            ethereum: {
              createOnLogin: "eoa",
            },
          },
          providerConfig: {
            chains: skaleSupportedChains,
            transports,
            announceProvider: true,
          },
        }),
      ];

const wagmiConfig = createConfig({
  chains: skaleSupportedChains,
  connectors,
  transports,
  ssr: true,
});

export const Provider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
