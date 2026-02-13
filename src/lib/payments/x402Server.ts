import type { NextRequest, NextResponse } from "next/server";
import { withX402FromHTTPServer } from "@x402/next";
import {
  HTTPFacilitatorClient,
  x402HTTPResourceServer,
  x402ResourceServer,
  type RouteConfig,
} from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import connectDb from "@/app/api/db/connectDb";
import PaymentReceipt from "@/app/api/models/PaymentReceipt";
import {
  facilitatorUrl,
  skaleNetwork,
  skaleX402Network,
  x402PayToAddress,
} from "@/lib/skale";
import { PAYMENT_REASON_CODES } from "./reasonCodes";

type RouteHandler<T = unknown> = (
  request: NextRequest,
) => Promise<NextResponse<T>>;

const SERVER_KEY = "__prompthash_x402_http_servers";

const includeBaseSepoliaFallback =
  (process.env.ENABLE_X402_BASE_SEPOLIA_FALLBACK ?? "false").toLowerCase() ===
  "true";

const networkToAssetMap: Record<string, string> = {
  [skaleX402Network]: skaleNetwork.paymentTokenAddress,
};

const decimalToAtomic = (value: number, decimals: number) => {
  const normalized = value.toFixed(decimals);
  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return `${whole}${paddedFraction}`;
};

const safeReceiptWrite = async (payload: Record<string, unknown>) => {
  try {
    await connectDb();
    await PaymentReceipt.create(payload);
  } catch (error) {
    console.error("x402 receipt write failed:", error);
  }
};

const getServerStore = () => {
  const globalRef = globalThis as unknown as Record<string, Map<string, x402HTTPResourceServer>>;
  if (!globalRef[SERVER_KEY]) {
    globalRef[SERVER_KEY] = new Map<string, x402HTTPResourceServer>();
  }
  return globalRef[SERVER_KEY];
};

function createHttpServer(routeKey: string, routeConfig: RouteConfig) {
  const facilitator = new HTTPFacilitatorClient({
    url: facilitatorUrl,
  });

  const scheme = new ExactEvmScheme().registerMoneyParser(async (amount, network) => {
    const asset = networkToAssetMap[network];
    if (!asset) {
      return null;
    }
    return {
      asset,
      amount: decimalToAtomic(amount, 6),
      extra: {
        symbol: "USDC",
        decimals: 6,
      },
    };
  });

  const resourceServer = new x402ResourceServer(facilitator)
    .register(skaleX402Network, scheme)
    .onAfterVerify(async ({ paymentPayload, requirements, result }) => {
      if (result.isValid) {
        return;
      }
      await safeReceiptWrite({
        requestId: paymentPayload.payload?.requestId ?? crypto.randomUUID(),
        endpoint: paymentPayload.resource?.url ?? routeKey,
        status: "failed",
        reasonCode: PAYMENT_REASON_CODES.verifyFailed,
        network: requirements.network,
        asset: requirements.asset,
        amountAtomic: requirements.amount,
        facilitatorUrl,
        metadata: {
          result,
        },
      });
    })
    .onAfterSettle(async ({ paymentPayload, requirements, result }) => {
      await safeReceiptWrite({
        requestId: paymentPayload.payload?.requestId ?? crypto.randomUUID(),
        endpoint: paymentPayload.resource?.url ?? routeKey,
        status: result.success ? "settled" : "failed",
        reasonCode: result.success
          ? PAYMENT_REASON_CODES.settled
          : PAYMENT_REASON_CODES.settleFailed,
        walletAddress: result.payer ?? undefined,
        network: requirements.network,
        asset: requirements.asset,
        amountAtomic: requirements.amount,
        txHash: result.transaction,
        facilitatorUrl,
        metadata: {
          result,
        },
      });
    });

  if (includeBaseSepoliaFallback) {
    networkToAssetMap["eip155:324705682"] = skaleNetwork.paymentTokenAddress;
    resourceServer.register("eip155:324705682", scheme);
  }

  const httpServer = new x402HTTPResourceServer(resourceServer, {
    [routeKey]: routeConfig,
  });

  httpServer.onProtectedRequest(async (context) => {
    const requestId =
      context.adapter.getHeader("x-request-id") ?? crypto.randomUUID();
    const walletAddress =
      context.adapter.getHeader("x-wallet-address") ?? undefined;

    await safeReceiptWrite({
      requestId,
      endpoint: context.path,
      status: context.paymentHeader ? "payment_submitted" : "requires_payment",
      reasonCode: context.paymentHeader
        ? PAYMENT_REASON_CODES.paymentSubmitted
        : PAYMENT_REASON_CODES.paymentRequired,
      walletAddress,
      facilitatorUrl,
      metadata: {
        method: context.method,
      },
    });
  });

  return httpServer;
}

export function withSkaleX402<T>(
  routeKey: string,
  routeConfig: RouteConfig,
  handler: RouteHandler<T>,
) {
  const store = getServerStore();
  let httpServer = store.get(routeKey);
  if (!httpServer) {
    httpServer = createHttpServer(routeKey, routeConfig);
    store.set(routeKey, httpServer);
  }

  return withX402FromHTTPServer(handler, httpServer, undefined, undefined, true);
}

export const defaultX402RouteConfig: RouteConfig = {
  accepts: {
    scheme: "exact",
    network: skaleX402Network,
    payTo: x402PayToAddress,
    price: "$0.25",
    maxTimeoutSeconds: 90,
    extra: {
      symbol: "USDC",
      decimals: 6,
    },
  },
  description: "Premium SKALE PromptHash API access",
  mimeType: "application/json",
  unpaidResponseBody: () => ({
    contentType: "application/json",
    body: {
      message: "Payment required to access premium generation.",
      reasonCode: PAYMENT_REASON_CODES.paymentRequired,
    },
  }),
};
