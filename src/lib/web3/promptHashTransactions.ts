import { BITE } from "@skalenetwork/bite";
import type { Address, Hex, WalletClient } from "viem";
import { encodeFunctionData } from "viem";
import { biteEnabled, biteGasLimit, biteRpcUrl } from "@/lib/skale";
import { ABI, contractAddress } from "@/web3/PromptHash";

type PromptHashWriteRequest = {
  walletClient: WalletClient;
  account: Address;
  functionName: "createPrompt" | "listPromptForSale" | "buyPrompt";
  args: readonly unknown[];
  value?: bigint;
};

const toGasLimit = (gasLimit: string | undefined) => {
  if (!gasLimit) {
    return BigInt(biteGasLimit);
  }
  if (gasLimit.startsWith("0x")) {
    return BigInt(gasLimit);
  }
  return BigInt(gasLimit);
};

export async function writePromptHashTransaction({
  walletClient,
  account,
  functionName,
  args,
  value,
}: PromptHashWriteRequest): Promise<`0x${string}`> {
  const data = encodeFunctionData({
    abi: ABI,
    functionName,
    args,
  });

  if (biteEnabled) {
    try {
      const bite = new BITE(biteRpcUrl);
      const encrypted = await bite.encryptTransaction({
        to: contractAddress,
        data,
        gasLimit: String(biteGasLimit),
      });

      return await walletClient.sendTransaction({
        account,
        to: encrypted.to as Address,
        data: encrypted.data as Hex,
        gas: toGasLimit(encrypted.gasLimit),
        value: value ?? 0n,
      });
    } catch (error) {
      console.error("BITE encrypted path failed, falling back:", error);
    }
  }

  return walletClient.sendTransaction({
    account,
    to: contractAddress,
    data,
    value: value ?? 0n,
  });
}
