"use client";

import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import {
  decodePaymentResponseHeader,
  wrapFetchWithPayment,
  x402Client,
} from "@x402/fetch";
import type { Address, WalletClient } from "viem";
import { paymentRiskPolicy, skaleBaseSepoliaX402Network, skaleX402Network } from "@/lib/skale";
import { evaluateSpendPolicy, getDailySpendStorageKey } from "./policy";
import { PAYMENT_REASON_CODES } from "./reasonCodes";
import {
  type PaymentState,
  transitionPaymentState,
} from "./stateMachine";

type PaymentConfirmationContext = {
  amountAtomic: string;
  asset: string;
  network: string;
};

type PaidRequestParams = {
  walletClient: WalletClient;
  address: Address;
  input: RequestInfo | URL;
  init?: RequestInit;
  confirmPayment: (context: PaymentConfirmationContext) => Promise<boolean>;
};

export type PaidRequestResult = {
  response: Response;
  settlement: ReturnType<typeof decodePaymentResponseHeader> | null;
  state: PaymentState;
  selectedRequirement: PaymentConfirmationContext | null;
};

const readDailySpend = (address: string) => {
  if (typeof window === "undefined") {
    return 0;
  }
  const raw = window.localStorage.getItem(getDailySpendStorageKey(address));
  return raw ? Number(raw) : 0;
};

const writeDailySpend = (address: string, value: number) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(getDailySpendStorageKey(address), String(value));
};

const withTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

export async function requestWithX402Payment({
  walletClient,
  address,
  input,
  init,
  confirmPayment,
}: PaidRequestParams): Promise<PaidRequestResult> {
  let state: PaymentState = "idle";
  let selectedRequirement: PaymentConfirmationContext | null = null;

  const client = new x402Client();
  registerExactEvmScheme(client, {
    signer: toClientEvmSigner({
      address,
      signTypedData: async (typedData) =>
        walletClient.signTypedData({
          account: address,
          domain: typedData.domain as any,
          types: typedData.types as any,
          primaryType: typedData.primaryType as any,
          message: typedData.message as any,
        }),
    }),
    networks: [skaleX402Network, skaleBaseSepoliaX402Network],
  });

  client.onBeforePaymentCreation(async ({ selectedRequirements }) => {
    state = transitionPaymentState(state, "payment_required_received");

    selectedRequirement = {
      amountAtomic: selectedRequirements.amount,
      asset: selectedRequirements.asset,
      network: selectedRequirements.network,
    };

    const dailySpendUSD = readDailySpend(address);
    const policy = evaluateSpendPolicy({
      assetAddress: selectedRequirements.asset,
      amountAtomic: selectedRequirements.amount,
      dailySpentUSD: dailySpendUSD,
    });

    if (!policy.ok) {
      return {
        abort: true,
        reason: `${policy.reason}:${policy.message}`,
      };
    }

    state = transitionPaymentState(state, "policy_ok");
    state = transitionPaymentState(state, "confirm");

    const approved = await confirmPayment({
      amountAtomic: selectedRequirements.amount,
      asset: selectedRequirements.asset,
      network: selectedRequirements.network,
    });
    if (!approved) {
      return {
        abort: true,
        reason: PAYMENT_REASON_CODES.userDeclined,
      };
    }

    state = transitionPaymentState(state, "submit");
    return undefined;
  });

  client.onAfterPaymentCreation(async () => {
    // Payment payload signed and attached.
  });

  const paidFetch = wrapFetchWithPayment(
    (wrappedInput, wrappedInit) =>
      withTimeout(
        wrappedInput,
        wrappedInit,
        paymentRiskPolicy.requestTimeoutMs,
      ),
    client,
  );

  state = transitionPaymentState(state, "start");

  let attempt = 0;
  while (attempt <= paymentRiskPolicy.retryCount) {
    try {
      const response = await paidFetch(input, init);
      const paymentResponseHeader = response.headers.get("PAYMENT-RESPONSE");
      const settlement = paymentResponseHeader
        ? decodePaymentResponseHeader(paymentResponseHeader)
        : null;

      if (settlement && selectedRequirement) {
        const current = readDailySpend(address);
        const amount = Number(selectedRequirement.amountAtomic) / 1_000_000;
        writeDailySpend(address, current + amount);
        state = transitionPaymentState(state, "settle_ok");
      }

      return {
        response,
        settlement,
        state,
        selectedRequirement,
      };
    } catch (error) {
      attempt += 1;
      if (attempt > paymentRiskPolicy.retryCount) {
        state = transitionPaymentState(state, "error");
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }

  state = transitionPaymentState(state, "error");
  throw new Error(PAYMENT_REASON_CODES.unexpectedError);
}
