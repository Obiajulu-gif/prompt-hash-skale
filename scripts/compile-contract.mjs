import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const ROOT = process.cwd();
const CONTRACT_PATH = path.join(ROOT, "src", "web3", "PromptHash.sol");
const ARTIFACT_PATH = path.join(ROOT, "src", "web3", "PromptHash.artifact.json");

const readNumber = (value, fallback) => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const chainId = readNumber(
  process.env.SKALE_CHAIN_ID ?? process.env.NEXT_PUBLIC_SKALE_CHAIN_ID,
  103698795,
);
const evmVersion =
  process.env.SKALE_EVM_VERSION ||
  (chainId === 103698795 ? "istanbul" : "shanghai");

const source = fs.readFileSync(CONTRACT_PATH, "utf8");

const findImports = (importPath) => {
  const localPath = path.resolve(path.dirname(CONTRACT_PATH), importPath);
  const nodeModulesPath = path.resolve(ROOT, "node_modules", importPath);

  if (fs.existsSync(localPath)) {
    return { contents: fs.readFileSync(localPath, "utf8") };
  }
  if (fs.existsSync(nodeModulesPath)) {
    return { contents: fs.readFileSync(nodeModulesPath, "utf8") };
  }

  return { error: `Import not found: ${importPath}` };
};

const input = {
  language: "Solidity",
  sources: {
    "PromptHash.sol": {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    evmVersion,
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
if (output.errors?.length) {
  const hardErrors = output.errors.filter((entry) => entry.severity === "error");
  for (const entry of output.errors) {
    const prefix = entry.severity === "error" ? "ERROR" : "WARN";
    console.log(`[${prefix}] ${entry.formattedMessage}`);
  }
  if (hardErrors.length) {
    process.exit(1);
  }
}

const contract = output.contracts?.["PromptHash.sol"]?.PromptHash;
if (!contract) {
  throw new Error("Compilation succeeded but PromptHash artifact was not generated.");
}

const artifact = {
  contractName: "PromptHash",
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
  deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
  compilerVersion: solc.version(),
  evmVersion,
  generatedAt: new Date().toISOString(),
  chainId,
};

fs.writeFileSync(ARTIFACT_PATH, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(`Compiled PromptHash with evmVersion=${evmVersion}`);
console.log(`Artifact written to ${ARTIFACT_PATH}`);
