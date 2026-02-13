import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { ethers } from "ethers";

const ROOT = process.cwd();
const ARTIFACT_PATH = path.join(ROOT, "src", "web3", "PromptHash.artifact.json");
const DEPLOYMENT_PATH = path.join(ROOT, "src", "web3", "PromptHash.deployment.json");

const DEFAULTS = {
  chainId: 103698795,
  rpcUrl:
    "https://base-sepolia-testnet.skalenodes.com/v1/bite-v2-sandbox",
  explorerUrl:
    "https://base-sepolia-testnet-explorer.skalenodes.com:10032",
};

const readEnv = (keys, fallback) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
};

const readNumber = (raw, fallback) => {
  const parsed = Number(raw ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const chainId = readNumber(
  readEnv(["SKALE_CHAIN_ID", "NEXT_PUBLIC_SKALE_CHAIN_ID"], String(DEFAULTS.chainId)),
  DEFAULTS.chainId,
);
const rpcUrl = readEnv(
  ["SKALE_RPC_URL", "NEXT_PUBLIC_SKALE_RPC_URL"],
  DEFAULTS.rpcUrl,
);
const explorerUrl = readEnv(
  ["SKALE_EXPLORER_URL", "NEXT_PUBLIC_SKALE_EXPLORER_URL"],
  DEFAULTS.explorerUrl,
);

const privateKey = readEnv(["DEPLOYER_PRIVATE_KEY"], "");
if (!privateKey) {
  throw new Error("Missing DEPLOYER_PRIVATE_KEY.");
}

if (!fs.existsSync(ARTIFACT_PATH)) {
  console.log("Artifact not found. Running contract compilation first...");
  execSync("npm run compile:contract", { stdio: "inherit" });
}

const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
if (!artifact?.abi || !artifact?.bytecode) {
  throw new Error("Invalid artifact format. Missing abi/bytecode.");
}

const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
const wallet = new ethers.Wallet(privateKey, provider);

const feeWallet = readEnv(
  [
    "FEE_WALLET_ADDRESS",
    "X402_PAY_TO_ADDRESS",
    "NEXT_PUBLIC_X402_PAY_TO_ADDRESS",
  ],
  wallet.address,
);
const initialFeeBps = readNumber(process.env.PROMPTHASH_INITIAL_FEE_BPS, 100);

if (initialFeeBps < 0 || initialFeeBps > 1000) {
  throw new Error("PROMPTHASH_INITIAL_FEE_BPS must be between 0 and 1000.");
}

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
const contract = await factory.deploy(feeWallet, initialFeeBps);
await contract.waitForDeployment();

const deployTx = contract.deploymentTransaction();
if (!deployTx) {
  throw new Error("Deployment transaction missing.");
}

const deployment = {
  contractName: "PromptHash",
  contractAddress: contract.target,
  txHash: deployTx.hash,
  chainId,
  rpcUrl,
  explorerUrl,
  explorerContractUrl: `${explorerUrl}/address/${contract.target}`,
  explorerTxUrl: `${explorerUrl}/tx/${deployTx.hash}`,
  feeWallet,
  feeBps: initialFeeBps,
  deployedAt: new Date().toISOString(),
  command: `node scripts/deploy-skale.mjs`,
};

fs.writeFileSync(DEPLOYMENT_PATH, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");

console.log("=== SKALE Deployment Complete ===");
console.log(`Contract Address: ${deployment.contractAddress}`);
console.log(`Deployment Tx:    ${deployment.txHash}`);
console.log(`Explorer (tx):    ${deployment.explorerTxUrl}`);
console.log(`Explorer (addr):  ${deployment.explorerContractUrl}`);
console.log(`Command:          ${deployment.command}`);
console.log(`Saved:            ${DEPLOYMENT_PATH}`);
