import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/api/db/connectDb";
import PaymentReceipt from "@/app/api/models/PaymentReceipt";

const parseLimit = (raw: string | null) => {
  const parsed = Number(raw ?? 25);
  if (!Number.isFinite(parsed)) {
    return 25;
  }
  return Math.max(1, Math.min(parsed, 200));
};

export async function POST(request: NextRequest) {
  try {
    await connectDb();
    const payload = await request.json();

    if (!payload?.requestId || !payload?.endpoint || !payload?.status || !payload?.reasonCode) {
      return NextResponse.json(
        {
          error:
            "requestId, endpoint, status, and reasonCode are required for payment receipts.",
        },
        { status: 400 },
      );
    }

    const receipt = await PaymentReceipt.create({
      requestId: String(payload.requestId),
      endpoint: String(payload.endpoint),
      walletAddress: payload.walletAddress
        ? String(payload.walletAddress).toLowerCase()
        : undefined,
      status: String(payload.status),
      reasonCode: String(payload.reasonCode),
      network: payload.network ? String(payload.network) : undefined,
      asset: payload.asset ? String(payload.asset).toLowerCase() : undefined,
      amountAtomic: payload.amountAtomic ? String(payload.amountAtomic) : undefined,
      txHash: payload.txHash ? String(payload.txHash) : undefined,
      facilitatorUrl: payload.facilitatorUrl
        ? String(payload.facilitatorUrl)
        : undefined,
      metadata: payload.metadata ?? {},
    });

    return NextResponse.json({ success: true, receipt });
  } catch (error: any) {
    console.error("Failed to write payment receipt:", error);
    return NextResponse.json(
      {
        error: error?.message ?? "Failed to save payment receipt",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);

    const limit = parseLimit(searchParams.get("limit"));
    const walletAddress = searchParams.get("walletAddress");
    const status = searchParams.get("status");
    const endpoint = searchParams.get("endpoint");

    const query: Record<string, string> = {};
    if (walletAddress) {
      query.walletAddress = walletAddress.toLowerCase();
    }
    if (status) {
      query.status = status;
    }
    if (endpoint) {
      query.endpoint = endpoint;
    }

    const receipts = await PaymentReceipt.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(receipts);
  } catch (error: any) {
    console.error("Failed to fetch payment receipts:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch payment receipts" },
      { status: 500 },
    );
  }
}
