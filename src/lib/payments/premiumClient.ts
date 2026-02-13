"use client";

import type { Address, WalletClient } from "viem";
import { facilitatorUrl } from "@/lib/skale";
import { PAYMENT_REASON_CODES } from "./reasonCodes";
import { requestWithX402Payment } from "./x402Client";

type PurchaseParams = {
  walletClient: WalletClient;
  address: Address;
  prompt: string;
  useCase?: string;
  confirmPayment: (context: {
    amountAtomic: string;
    asset: string;
    network: string;
  }) => Promise<boolean>;
};

const toReasonCode = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes(PAYMENT_REASON_CODES.tokenNotAllowed)) {
    return PAYMENT_REASON_CODES.tokenNotAllowed;
  }
  if (message.includes(PAYMENT_REASON_CODES.maxPerTxExceeded)) {
    return PAYMENT_REASON_CODES.maxPerTxExceeded;
  }
  if (message.includes(PAYMENT_REASON_CODES.dailyCapExceeded)) {
    return PAYMENT_REASON_CODES.dailyCapExceeded;
  }
  if (message.includes(PAYMENT_REASON_CODES.userDeclined)) {
    return PAYMENT_REASON_CODES.userDeclined;
  }
  if (message.includes("AbortError")) {
    return PAYMENT_REASON_CODES.requestTimeout;
  }
  return PAYMENT_REASON_CODES.networkError;
};

const saveReceipt = async (payload: Record<string, unknown>) => {
  try {
    await fetch("/api/payments/receipts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to persist payment receipt:", error);
  }
};

export async function purchasePremiumGeneration({
  walletClient,
  address,
  prompt,
  useCase = "general",
  confirmPayment,
}: PurchaseParams) {
  const requestId = crypto.randomUUID();

  try {
    const { response, settlement, selectedRequirement } =
      await requestWithX402Payment({
        walletClient,
        address,
        input: "/api/premium/generate",
        init: {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-request-id": requestId,
            "x-wallet-address": address,
          },
          body: JSON.stringify({
            prompt,
            useCase,
          }),
        },
        confirmPayment,
      });

    const data = await response.json();
    if (!response.ok) {
      await saveReceipt({
        requestId,
        endpoint: "/api/premium/generate",
        walletAddress: address,
        status: "failed",
        reasonCode: data?.reasonCode ?? PAYMENT_REASON_CODES.unexpectedError,
        metadata: {
          responseStatus: response.status,
          body: data,
        },
      });
      throw new Error(data?.error ?? "Premium generation failed");
    }

    await saveReceipt({
      requestId,
      endpoint: "/api/premium/generate",
      walletAddress: address,
      status: "settled",
      reasonCode: PAYMENT_REASON_CODES.settled,
      network: selectedRequirement?.network,
      asset: selectedRequirement?.asset,
      amountAtomic: selectedRequirement?.amountAtomic,
      txHash: settlement?.transaction ?? undefined,
      facilitatorUrl,
      metadata: {
        settlement,
      },
    });

    return {
      ...data,
      payment: {
        requestId,
        settlement,
        selectedRequirement,
      },
    };
  } catch (error) {
    await saveReceipt({
      requestId,
      endpoint: "/api/premium/generate",
      walletAddress: address,
      status: "policy_rejected",
      reasonCode: toReasonCode(error),
      facilitatorUrl,
      metadata: {
        message: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
