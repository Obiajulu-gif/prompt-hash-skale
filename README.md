# PromptHash (SKALE Hackathon Migration)

PromptHash is a Next.js prompt marketplace migrated from Avalanche to SKALE with:

- SKALE network defaults (BITE v2 sandbox + Base Sepolia fallback support)
- CDP embedded wallets (`@coinbase/cdp-wagmi`) with email/OTP auth flow
- x402-protected premium API (`/api/premium/generate`)
- Optional BITE encrypted transaction path for contract writes
- Payment policy guardrails + receipt/audit logging + debug view

## SKALE Defaults

- Primary hackathon chain:
  - RPC: `https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox`
  - Chain ID: `103698795`
  - Explorer: `https://base-sepolia-testnet-explorer.skalenodes.com:10032`
  - USDC: `0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8`
- Fallback Base Sepolia chain:
  - Chain ID: `324705682`
  - RPC default: `https://testnet.skalenodes.com/v1/aware-fake-trim-testnet`

## Environment Variables

Create a `.env.local` and set:

```bash
# Core app
MONGODB_URI=...
NEXT_PUBLIC_CDP_PROJECT_ID=...

# SKALE network overrides (optional)
SKALE_NETWORK_PROFILE=hackathon # hackathon | base-sepolia
SKALE_CHAIN_ID=103698795
SKALE_RPC_URL=https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox
SKALE_EXPLORER_URL=https://base-sepolia-testnet-explorer.skalenodes.com:10032
SKALE_USDC_TOKEN=0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8

# Base Sepolia fallback overrides (optional)
SKALE_BASE_SEPOLIA_CHAIN_ID=324705682
SKALE_BASE_SEPOLIA_RPC_URL=https://testnet.skalenodes.com/v1/aware-fake-trim-testnet
SKALE_BASE_SEPOLIA_EXPLORER_URL=https://base-sepolia-testnet-explorer.skalenodes.com:10032
SKALE_BASE_SEPOLIA_USDC_TOKEN=0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8

# Contract and x402
PROMPTHASH_CONTRACT_ADDRESS=0x...
X402_FACILITATOR_URL=https://gateway.kobaru.io
X402_PAY_TO_ADDRESS=0x... # treasury/seller receiving x402 payments

# Risk policy
PAYMENT_MAX_PER_TX_USDC=2
PAYMENT_MAX_DAILY_USDC=10
PAYMENT_REQUEST_TIMEOUT_MS=15000
PAYMENT_RETRY_COUNT=2

# Optional BITE
ENABLE_BITE=false
BITE_RPC_URL=https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox
BITE_GAS_LIMIT=700000

# Deployment
DEPLOYER_PRIVATE_KEY=0x...
FEE_WALLET_ADDRESS=0x...
PROMPTHASH_INITIAL_FEE_BPS=100

# Optional debug protection
ADMIN_DEBUG_TOKEN=...
```

## Install / Run

```bash
npm install --legacy-peer-deps
npm run dev
```

## Contract Compile / Deploy

Compile (defaults to `evmVersion=istanbul` on hackathon chain):

```bash
npm run compile:contract
```

Deploy:

```bash
npm run deploy:skale
```

Deployment outputs are saved to:

- `src/web3/PromptHash.artifact.json`
- `src/web3/PromptHash.deployment.json`

## x402 Flow

Seller-side paywall:

- Endpoint: `POST /api/premium/generate`
- Wrapper: `withSkaleX402(...)` in `src/lib/payments/x402Server.ts`
- Facilitator: defaults to `https://gateway.kobaru.io`

Buyer flow:

- Client helper: `src/lib/payments/x402Client.ts`
- Premium purchase helper: `src/lib/payments/premiumClient.ts`
- Handles `402 -> payment signing -> retry -> settlement decode`

## Guardrails / Audit Trail

- Token allowlist: `src/lib/payments/policy.ts`
- Spend caps: per transaction + per day
- Explicit user confirmation before payment
- Deterministic payment state machine: `src/lib/payments/stateMachine.ts`
- Receipts persistence:
  - Write/read: `src/app/api/payments/receipts/route.ts`
  - Admin debug: `src/app/api/admin/payment-receipts/route.ts`
  - UI: `/admin/receipts`

## Tests / Build

```bash
npm run test
npm run build
```
