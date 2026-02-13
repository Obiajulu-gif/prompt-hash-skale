import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/app/api/db/connectDb";
import PaymentReceipt from "@/app/api/models/PaymentReceipt";

const ADMIN_DEBUG_TOKEN = process.env.ADMIN_DEBUG_TOKEN;

function isAuthorized(request: NextRequest) {
  if (!ADMIN_DEBUG_TOKEN) {
    return true;
  }
  const token = request.headers.get("x-admin-token");
  return token === ADMIN_DEBUG_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(limitRaw, 500))
      : 50;

    const receipts = await PaymentReceipt.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      count: receipts.length,
      receipts,
    });
  } catch (error: any) {
    console.error("Failed to fetch admin receipts:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch receipts" },
      { status: 500 },
    );
  }
}
