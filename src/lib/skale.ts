import { defineChain, type Address, type Chain } from "viem";

type NetworkDefaults = {
  profile: "hackathon" | "base-sepolia";
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  usdcToken: Address;
};

const HACKATHON_DEFAULTS: NetworkDefaults = {
  profile: "hackathon",
  name: "SKALE BITE v2 Sandbox",
  chainId: 103698795,
  rpcUrl:
    "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
  explorerUrl:
    "https://base-sepolia-testnet-explorer.skalenodes.com:10032",
  usdcToken: "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8",
};

const BASE_SEPOLIA_DEFAULTS: NetworkDefaults = {
  profile: "base-sepolia",
  name: "SKALE Base Sepolia",
  chainId: 324705682,
  rpcUrl: "https://testnet.skalenodes.com/v1/aware-fake-trim-testnet",
  explorerUrl:
    "https://base-sepolia-testnet-explorer.skalenodes.com:10032",
  usdcToken: "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8",
};

const DEFAULT_FACILITATOR_URL = "https://gateway.kobaru.io";
const DEFAULT_NATIVE_SYMBOL = "sFUEL";

const readEnv = (keys: string[], fallback: string) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
};

const readNumericEnv = (keys: string[], fallback: number) => {
  const raw = readEnv(keys, String(fallback));
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const selectedProfile =
  readEnv(
    ["SKALE_NETWORK_PROFILE", "NEXT_PUBLIC_SKALE_NETWORK_PROFILE"],
    HACKATHON_DEFAULTS.profile,
  ) === BASE_SEPOLIA_DEFAULTS.profile
    ? BASE_SEPOLIA_DEFAULTS.profile
    : HACKATHON_DEFAULTS.profile;

const selectedDefaults =
  selectedProfile === BASE_SEPOLIA_DEFAULTS.profile
    ? BASE_SEPOLIA_DEFAULTS
    : HACKATHON_DEFAULTS;

export const skaleNetwork = {
  profile: selectedProfile,
  name: readEnv(
    ["SKALE_NETWORK_NAME", "NEXT_PUBLIC_SKALE_NETWORK_NAME"],
    selectedDefaults.name,
  ),
  chainId: readNumericEnv(
    ["SKALE_CHAIN_ID", "NEXT_PUBLIC_SKALE_CHAIN_ID"],
    selectedDefaults.chainId,
  ),
  rpcUrl: readEnv(
    ["SKALE_RPC_URL", "NEXT_PUBLIC_SKALE_RPC_URL"],
    selectedDefaults.rpcUrl,
  ),
  explorerUrl: readEnv(
    ["SKALE_EXPLORER_URL", "NEXT_PUBLIC_SKALE_EXPLORER_URL"],
    selectedDefaults.explorerUrl,
  ),
  nativeSymbol: readEnv(
    [
      "SKALE_NATIVE_SYMBOL",
      "NEXT_PUBLIC_SKALE_NATIVE_SYMBOL",
      "NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL",
    ],
    DEFAULT_NATIVE_SYMBOL,
  ),
  paymentTokenAddress: readEnv(
    [
      "SKALE_USDC_TOKEN",
      "NEXT_PUBLIC_SKALE_USDC_TOKEN",
      "PAYMENT_TOKEN_ADDRESS",
      "NEXT_PUBLIC_PAYMENT_TOKEN_ADDRESS",
    ],
    selectedDefaults.usdcToken,
  ) as Address,
};

export const skaleBaseSepoliaNetwork = {
  ...BASE_SEPOLIA_DEFAULTS,
  name: readEnv(
    [
      "SKALE_BASE_SEPOLIA_NAME",
      "NEXT_PUBLIC_SKALE_BASE_SEPOLIA_NAME",
      "SKALE_BASE_SEPOLIA_CHAIN_NAME",
      "NEXT_PUBLIC_SKALE_BASE_SEPOLIA_CHAIN_NAME",
    ],
    BASE_SEPOLIA_DEFAULTS.name,
  ),
  chainId: readNumericEnv(
    [
      "SKALE_BASE_SEPOLIA_CHAIN_ID",
      "NEXT_PUBLIC_SKALE_BASE_SEPOLIA_CHAIN_ID",
    ],
    BASE_SEPOLIA_DEFAULTS.chainId,
  ),
  rpcUrl: readEnv(
    [
      "SKALE_BASE_SEPOLIA_RPC_URL",
      "NEXT_PUBLIC_SKALE_BASE_SEPOLIA_RPC_URL",
    ],
    BASE_SEPOLIA_DEFAULTS.rpcUrl,
  ),
  explorerUrl: readEnv(
    [
      "SKALE_BASE_SEPOLIA_EXPLORER_URL",
      "NEXT_PUBLIC_SKALE_BASE_SEPOLIA_EXPLORER_URL",
    ],
    BASE_SEPOLIA_DEFAULTS.explorerUrl,
  ),
  usdcToken: readEnv(
    [
      "SKALE_BASE_SEPOLIA_USDC_TOKEN",
      "NEXT_PUBLIC_SKALE_BASE_SEPOLIA_USDC_TOKEN",
    ],
    BASE_SEPOLIA_DEFAULTS.usdcToken,
  ) as Address,
};

export const skaleHackathonNetwork = {
  ...HACKATHON_DEFAULTS,
  usdcToken: skaleNetwork.paymentTokenAddress,
};

const makeChain = (network: {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
}): Chain =>
  defineChain({
    id: network.chainId,
    name: network.name,
    nativeCurrency: {
      name: "SKALE sFUEL",
      symbol: skaleNetwork.nativeSymbol,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [network.rpcUrl] },
      public: { http: [network.rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: `${network.name} Explorer`,
        url: network.explorerUrl,
      },
    },
    testnet: true,
  });

export const skaleChain = makeChain(skaleNetwork);
export const skaleBaseSepoliaChain = makeChain(skaleBaseSepoliaNetwork);

const dedupeChains = (chains: Chain[]) => {
  const seen = new Set<number>();
  return chains.filter((chain) => {
    if (seen.has(chain.id)) {
      return false;
    }
    seen.add(chain.id);
    return true;
  });
};

export const skaleSupportedChains = dedupeChains([
  skaleChain,
  skaleBaseSepoliaChain,
]) as [Chain, ...Chain[]];

export const skaleX402Network = `eip155:${skaleChain.id}` as const;
export const skaleBaseSepoliaX402Network =
  `eip155:${skaleBaseSepoliaChain.id}` as const;

export const facilitatorUrl = readEnv(
  ["X402_FACILITATOR_URL", "NEXT_PUBLIC_X402_FACILITATOR_URL"],
  DEFAULT_FACILITATOR_URL,
);

export const promptHashContractAddress = readEnv(
  [
    "PROMPTHASH_CONTRACT_ADDRESS",
    "NEXT_PUBLIC_PROMPTHASH_CONTRACT_ADDRESS",
  ],
  "0x0000000000000000000000000000000000000000",
) as Address;

export const x402PayToAddress = readEnv(
  [
    "X402_PAY_TO_ADDRESS",
    "NEXT_PUBLIC_X402_PAY_TO_ADDRESS",
    "FEE_WALLET_ADDRESS",
    "NEXT_PUBLIC_FEE_WALLET_ADDRESS",
  ],
  "0x000000000000000000000000000000000000dEaD",
) as Address;

export const biteEnabled = readEnv(
  ["ENABLE_BITE", "NEXT_PUBLIC_ENABLE_BITE"],
  "false",
).toLowerCase() === "true";

export const biteGasLimit = readNumericEnv(
  ["BITE_GAS_LIMIT", "NEXT_PUBLIC_BITE_GAS_LIMIT"],
  700_000,
);

export const biteRpcUrl = readEnv(
  ["BITE_RPC_URL", "NEXT_PUBLIC_BITE_RPC_URL"],
  skaleNetwork.rpcUrl,
);

export const paymentRiskPolicy = {
  maxPerTxUSDC: readNumericEnv(
    [
      "PAYMENT_MAX_PER_TX_USDC",
      "NEXT_PUBLIC_PAYMENT_MAX_PER_TX_USDC",
    ],
    2,
  ),
  maxDailyUSDC: readNumericEnv(
    ["PAYMENT_MAX_DAILY_USDC", "NEXT_PUBLIC_PAYMENT_MAX_DAILY_USDC"],
    10,
  ),
  requestTimeoutMs: readNumericEnv(["PAYMENT_REQUEST_TIMEOUT_MS"], 15_000),
  retryCount: readNumericEnv(["PAYMENT_RETRY_COUNT"], 2),
};

export const tokenAllowlist = [
  skaleNetwork.paymentTokenAddress.toLowerCase(),
  skaleBaseSepoliaNetwork.usdcToken.toLowerCase(),
];

export const explorerLinks = {
  tx: (hash: string) => `${skaleNetwork.explorerUrl}/tx/${hash}`,
  address: (address: string) =>
    `${skaleNetwork.explorerUrl}/address/${address}`,
};
