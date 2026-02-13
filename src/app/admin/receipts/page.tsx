"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PaymentReceipt = {
  _id: string;
  requestId: string;
  endpoint: string;
  status: string;
  reasonCode: string;
  walletAddress?: string;
  network?: string;
  asset?: string;
  amountAtomic?: string;
  txHash?: string;
  createdAt: string;
};

export default function PaymentReceiptsPage() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState("");

  const fetchReceipts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/payment-receipts?limit=100", {
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch receipts");
      }
      setReceipts(data.receipts ?? []);
    } catch (fetchError: any) {
      setError(fetchError.message ?? "Failed to fetch receipts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-foreground">
      <Navigation />
      <main className="flex-1 container py-10">
        <Card className="border-gray-800 bg-gray-950">
          <CardHeader className="space-y-3">
            <CardTitle>Payment Receipts Debug View</CardTitle>
            <p className="text-sm text-gray-400">
              Audit log for x402 payment attempts and outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Optional x-admin-token"
                value={adminToken}
                onChange={(event) => setAdminToken(event.target.value)}
              />
              <Button onClick={fetchReceipts}>Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-gray-400">Loading receipts...</p>
            ) : error ? (
              <p className="text-sm text-red-400">{error}</p>
            ) : receipts.length === 0 ? (
              <p className="text-sm text-gray-400">No receipts yet.</p>
            ) : (
              <div className="space-y-3">
                {receipts.map((receipt) => (
                  <div
                    key={receipt._id}
                    className="rounded-lg border border-gray-800 bg-gray-900/40 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{receipt.status}</Badge>
                      <Badge variant="outline">{receipt.reasonCode}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(receipt.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-200">
                      {receipt.endpoint}
                    </p>
                    <p className="text-xs text-gray-400 break-all">
                      requestId: {receipt.requestId}
                    </p>
                    {receipt.walletAddress ? (
                      <p className="text-xs text-gray-400 break-all">
                        wallet: {receipt.walletAddress}
                      </p>
                    ) : null}
                    {receipt.txHash ? (
                      <p className="text-xs text-gray-400 break-all">
                        tx: {receipt.txHash}
                      </p>
                    ) : null}
                    {receipt.network ? (
                      <p className="text-xs text-gray-400">
                        {receipt.network} | {receipt.asset ?? "asset?"} |{" "}
                        {receipt.amountAtomic ?? "amount?"}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
