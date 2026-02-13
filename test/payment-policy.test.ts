import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSpendPolicy, atomicToDecimal } from "../src/lib/payments/policy";
import { PAYMENT_REASON_CODES } from "../src/lib/payments/reasonCodes";
import { skaleNetwork } from "../src/lib/skale";

test("accepts allowed token under policy caps", () => {
  const result = evaluateSpendPolicy({
    assetAddress: skaleNetwork.paymentTokenAddress,
    amountAtomic: "250000", // 0.25 USDC
    dailySpentUSD: 0,
  });

  assert.equal(result.ok, true);
});

test("rejects token outside allowlist", () => {
  const result = evaluateSpendPolicy({
    assetAddress: "0x000000000000000000000000000000000000dead",
    amountAtomic: "250000",
    dailySpentUSD: 0,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, PAYMENT_REASON_CODES.tokenNotAllowed);
  }
});

test("rejects when per-tx cap is exceeded", () => {
  const result = evaluateSpendPolicy({
    assetAddress: skaleNetwork.paymentTokenAddress,
    amountAtomic: "4000000", // 4 USDC
    dailySpentUSD: 0,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, PAYMENT_REASON_CODES.maxPerTxExceeded);
  }
});

test("rejects when daily cap is exceeded", () => {
  const result = evaluateSpendPolicy({
    assetAddress: skaleNetwork.paymentTokenAddress,
    amountAtomic: "1000000", // 1 USDC
    dailySpentUSD: 10,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, PAYMENT_REASON_CODES.dailyCapExceeded);
  }
});

test("converts atomic amount to decimal safely", () => {
  const decimal = atomicToDecimal("1234567", 6);
  assert.equal(decimal, 1.234567);
});
