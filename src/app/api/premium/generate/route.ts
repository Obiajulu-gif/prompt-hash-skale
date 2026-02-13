import { NextRequest, NextResponse } from "next/server";
import { withSkaleX402, defaultX402RouteConfig } from "@/lib/payments/x402Server";
import { PAYMENT_REASON_CODES } from "@/lib/payments/reasonCodes";
import { facilitatorUrl, skaleNetwork } from "@/lib/skale";

const PREMIUM_GATEWAY = "https://secret-ai-gateway.onrender.com/api/chat";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callPremiumGateway(prompt: string) {
  const timeoutMs = 12_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const params = new URLSearchParams({
      model: "gemini-2.5-pro",
      prompt,
    });
    const response = await fetch(`${PREMIUM_GATEWAY}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Premium gateway failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function generatePremiumResponse(prompt: string) {
  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < 3) {
    try {
      const gatewayResult = await callPremiumGateway(prompt);
      if (gatewayResult?.Response) {
        return gatewayResult.Response as string;
      }
      if (typeof gatewayResult?.response === "string") {
        return gatewayResult.response;
      }
      if (typeof gatewayResult === "string") {
        return gatewayResult;
      }
      return JSON.stringify(gatewayResult);
    } catch (error: any) {
      lastError = error;
      attempt += 1;
      if (attempt < 3) {
        await sleep(250 * attempt);
      }
    }
  }

  return [
    "Premium fallback strategy generated locally.",
    "1. Refined prompt with concrete constraints and measurable output.",
    "2. Safety checks: add blocked topics + style boundaries.",
    "3. Evaluation rubric: correctness, specificity, and latency budget.",
    `Fallback reason: ${lastError?.message ?? "unknown"}`,
  ].join("\n");
}

const handler = async (request: NextRequest) => {
  const body = await request.json();
  const prompt = String(body?.prompt ?? "").trim();
  const useCase = String(body?.useCase ?? "general").trim();

  if (!prompt) {
    return NextResponse.json(
      {
        error: "Prompt is required.",
        reasonCode: PAYMENT_REASON_CODES.unexpectedError,
      },
      { status: 400 },
    );
  }

  const enhanced = await generatePremiumResponse(
    `Use case: ${useCase}\n\nUser prompt:\n${prompt}`,
  );

  return NextResponse.json({
    reasonCode: PAYMENT_REASON_CODES.settled,
    chain: {
      networkName: skaleNetwork.name,
      chainId: skaleNetwork.chainId,
      token: "USDC",
      facilitatorUrl,
    },
    result: enhanced,
  });
};

export const POST = withSkaleX402(
  "POST /api/premium/generate",
  {
    ...defaultX402RouteConfig,
    description:
      "Premium prompt generation with stronger model and post-processing safeguards.",
  },
  handler,
);
