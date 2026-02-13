"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  initialize,
  signInWithEmail,
  signOut as cdpSignOut,
  verifyEmailOTP,
} from "@coinbase/cdp-core";
import { Loader2, LogOut, ShieldCheck, Wallet } from "lucide-react";
import {
  useAccount,
  useChains,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { skaleChain } from "@/lib/skale";

let cdpInitialized = false;

async function ensureCdpInitialized(projectId: string) {
  if (cdpInitialized) {
    return;
  }

  await initialize({
    projectId,
    ethereum: {
      createOnLogin: "eoa",
    },
  });

  cdpInitialized = true;
}

const formatAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const CustomConnectButton = () => {
  const cdpProjectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
  const { address, chainId, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchPending } = useSwitchChain();
  const chains = useChains();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [flowId, setFlowId] = useState("");
  const [otp, setOtp] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "otp">("email");
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cdpConnector = useMemo(
    () => connectors.find((connector) => connector.id === "cdp-embedded-wallet"),
    [connectors],
  );

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!cdpProjectId || !cdpConnector || isConnected) {
        return;
      }

      try {
        await ensureCdpInitialized(cdpProjectId);
        const user = await getCurrentUser();
        if (!user) {
          return;
        }

        await connectAsync({ connector: cdpConnector });
      } catch (error) {
        console.error("CDP bootstrap failed:", error);
      }
    };

    bootstrapSession();
  }, [cdpProjectId, cdpConnector, connectAsync, isConnected]);

  useEffect(() => {
    if (!address) {
      return;
    }

    fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address }),
    }).catch((error) => {
      console.error("Failed to sync user:", error);
    });
  }, [address]);

  const handleRequestOtp = async () => {
    if (!cdpProjectId) {
      setStatus("Missing NEXT_PUBLIC_CDP_PROJECT_ID");
      return;
    }

    if (!email.trim()) {
      setStatus("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Sending one-time code...");

    try {
      await ensureCdpInitialized(cdpProjectId);
      const response = await signInWithEmail({ email: email.trim() });
      setFlowId(response.flowId);
      setAuthStep("otp");
      setStatus("Code sent. Enter OTP to complete sign-in.");
    } catch (error: any) {
      console.error("signInWithEmail failed:", error);
      setStatus(error?.message ?? "Failed to send OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!flowId || !otp.trim()) {
      setStatus("Enter the OTP code.");
      return;
    }

    if (!cdpConnector) {
      setStatus("CDP connector unavailable.");
      return;
    }

    setIsSubmitting(true);
    setStatus("Verifying OTP and connecting wallet...");

    try {
      await verifyEmailOTP({ flowId, otp: otp.trim() });
      await connectAsync({ connector: cdpConnector });
      setStatus("Connected.");
      setOpen(false);
      setOtp("");
      setFlowId("");
      setAuthStep("email");
    } catch (error: any) {
      console.error("verifyEmailOTP/connect failed:", error);
      setStatus(error?.message ?? "OTP verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await cdpSignOut();
    } catch (error) {
      console.error("CDP signOut failed:", error);
    } finally {
      disconnect();
      setStatus("");
    }
  };

  const handleSwitchNetwork = async () => {
    if (chainId === skaleChain.id) {
      return;
    }
    await switchChainAsync({ chainId: skaleChain.id });
  };

  if (!isConnected || !address) {
    return (
      <>
        <Button
          onClick={() => setOpen(true)}
          className="ml-auto font-semibold border border-emerald-700 bg-transparent text-emerald-300 hover:bg-emerald-900/40"
        >
          {isConnectPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="mr-2 h-4 w-4" />
          )}
          Sign In Wallet
        </Button>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-950 p-6">
              <h3 className="text-lg font-semibold">CDP Embedded Wallet</h3>
              <p className="mt-1 text-sm text-gray-400">
                Authenticate with email + OTP to connect on SKALE.
              </p>

              {authStep === "email" ? (
                <div className="mt-4 space-y-3">
                  <Input
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button
                    className="w-full"
                    onClick={handleRequestOtp}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send OTP
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <Input
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button
                    className="w-full"
                    onClick={handleVerifyOtp}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify and Connect
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setAuthStep("email");
                      setOtp("");
                      setFlowId("");
                    }}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                </div>
              )}

              {status ? (
                <p className="mt-3 text-xs text-gray-300">{status}</p>
              ) : null}

              <Button
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  const activeChain = chains.find((chain) => chain.id === chainId);
  const unsupported = chainId !== skaleChain.id;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="border-gray-700 bg-gray-950/80 text-gray-100 hover:bg-gray-900"
      >
        <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
        {formatAddress(address)}
      </Button>

      <Button
        variant="outline"
        className="border-gray-700 bg-gray-950/80 text-gray-100 hover:bg-gray-900"
        onClick={handleSwitchNetwork}
        disabled={isSwitchPending || !unsupported}
      >
        {isSwitchPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {unsupported
          ? "Switch to SKALE"
          : activeChain?.name ?? "SKALE Connected"}
      </Button>

      <Button
        variant="ghost"
        className="text-gray-300 hover:text-white"
        onClick={handleDisconnect}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
};
