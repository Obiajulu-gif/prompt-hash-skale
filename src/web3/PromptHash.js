import { explorerLinks, promptHashContractAddress } from "@/lib/skale";
import deployment from "@/web3/PromptHash.deployment.json";

export const contractAddress =
  promptHashContractAddress !== "0x0000000000000000000000000000000000000000"
    ? promptHashContractAddress
    : deployment.contractAddress;
export const contractExplorerUrl = explorerLinks.address(contractAddress);

export const ABI = [
  {
    inputs: [
      { internalType: "address", name: "initialFeeWallet", type: "address" },
      { internalType: "uint16", name: "initialFeeBps", type: "uint16" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "string", name: "imageUrl", type: "string" },
      { indexed: false, internalType: "string", name: "description", type: "string" },
    ],
    name: "PromptCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
    ],
    name: "PromptListed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
    ],
    name: "PromptSold",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "imageUrl", type: "string" },
      { internalType: "string", name: "description", type: "string" },
    ],
    name: "createPrompt",
    outputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "buyPrompt",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "price", type: "uint256" },
    ],
    name: "listPromptForSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "feeBps",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];
