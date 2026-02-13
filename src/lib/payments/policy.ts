import { paymentRiskPolicy, tokenAllowlist } from "@/lib/skale";
import { PAYMENT_REASON_CODES, type PaymentReasonCode } from "./reasonCodes";

export type PolicyResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: PaymentReasonCode;
      message: string;
    };

const USDC_DECIMALS = 6;

const normalize = (value: string) => value.toLowerCase();

export function atomicToDecimal(amountAtomic: string, decimals = USDC_DECIMALS) {
  const amount = BigInt(amountAtomic);
  const divisor = 10n ** BigInt(decimals);
  const whole = Number(amount / divisor);
  const fraction = Number(amount % divisor) / Number(divisor);
  return whole + fraction;
}

export function isAllowedToken(assetAddress: string) {
  return tokenAllowlist.includes(normalize(assetAddress));
}

export function evaluateSpendPolicy(params: {
  assetAddress: string;
  amountAtomic: string;
  dailySpentUSD: number;
}) {
  if (!isAllowedToken(params.assetAddress)) {
    return {
      ok: false,
      reason: PAYMENT_REASON_CODES.tokenNotAllowed,
      message: "Token is not in the payment allowlist.",
    } satisfies PolicyResult;
  }

  const requestedUsd = atomicToDecimal(params.amountAtomic, USDC_DECIMALS);
  if (requestedUsd > paymentRiskPolicy.maxPerTxUSDC) {
    return {
      ok: false,
      reason: PAYMENT_REASON_CODES.maxPerTxExceeded,
      message: `Per-transaction cap exceeded (${paymentRiskPolicy.maxPerTxUSDC} USDC).`,
    } satisfies PolicyResult;
  }

  if (params.dailySpentUSD + requestedUsd > paymentRiskPolicy.maxDailyUSDC) {
    return {
      ok: false,
      reason: PAYMENT_REASON_CODES.dailyCapExceeded,
      message: `Daily cap exceeded (${paymentRiskPolicy.maxDailyUSDC} USDC).`,
    } satisfies PolicyResult;
  }

  return { ok: true } satisfies PolicyResult;
}

export function getDailySpendStorageKey(address: string) {
  const day = new Date().toISOString().slice(0, 10);
  return `prompthash:daily-spend:${normalize(address)}:${day}`;
}
