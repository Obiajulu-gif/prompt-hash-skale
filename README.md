## AI Prompt Marketplace

![PromptHash Dashboard](image/landing-page.png)

**PromptHash** is a dynamic, AI-powered marketplace connecting prompt creators with users seeking inspiration, productivity, and cutting-edge solutions. Our platform enables users to explore, create, buy, and sell high-quality AI prompts across various categories.

## Vision

Our vision is to become the go-to resource where creators and users converge—leveraging advanced AI models, privacy-focused blockchain infrastructure, and intuitive design—to spark transformative ideas across industries.

## Key Features

- 🔍 **Browse & Discover**: Explore curated collections of AI prompts from top creators
- 💰 **Buy & Sell Prompts**: Monetize your expertise or find the perfect prompt
- 🤖 **Advanced AI Integration**: Powered by Secret Network AI models including DeepSeek R1 (70B) and Llama 3.2 Vision
- 🔒 **Blockchain Security**: Built on Avalanche Blockchain
- 💬 **Conversational AI**: Maintain chat sessions with context awareness.
- 🏛️ **Governance**: Community-driven platform development
- ✨ **Prompt Engineering**: Tools to improve and optimize AI prompts.
- 👨‍💻 **Creator Profiles**: Dedicated space for top prompt creators
- 🖼️ **Multi-Format Support**: Generate images, text & code with ease
- 📚 **Comprehensive Documentation**: Detailed API documentation available via Swagger UI and ReDoc.

## 🚀 How We Use Avalanche Blockchain

### For Non-Technical Users

**Avalanche is our digital ledger and payment system** - think of it as a super-secure, decentralized database that records all prompt transactions and handles payments automatically. Here's what it does for you:

- **Secure Ownership**: When you create a prompt, it becomes a unique digital asset (NFT) stored on Avalanche
- **Automatic Payments**: When someone buys your prompt, payment is processed instantly and securely through smart contracts
- **Transparent History**: Every transaction is recorded publicly and can't be altered, ensuring trust and transparency
- **No Middlemen**: Direct peer-to-peer transactions without banks or payment processors taking fees
- **Global Access**: Anyone with an internet connection can participate, regardless of location

### For Technical Users

**Avalanche serves as our decentralized database and payment infrastructure** through the following technical implementation:

#### Smart Contract Architecture
- **ERC-721 NFT Contract**: `PromptHash.sol` deployed at `0x76744225486abccBFAEb0b597bDD676A2e6B90B0`
- **Upgradeable Contract**: Uses OpenZeppelin's UUPS pattern for future improvements
- **Gas Optimization**: Built on Avalanche C-Chain for cost-effective transactions

#### Core Functions
```solidity
// Create new prompts as NFTs
function createPrompt(string memory _imageUrl, string memory _description) external returns (uint256)

// List prompts for sale
function listPromptForSale(uint256 _tokenId, uint256 _price) external

// Purchase prompts with automatic fee distribution
function buyPrompt(uint256 _tokenId) external payable nonReentrant

// Retrieve all prompts
function getAllPrompts() external view returns (uint256[] memory, Prompt[] memory)
```

#### Network Configuration
- **Primary Network**: Avalanche C-Chain (Mainnet)
- **Test Network**: Avalanche Fuji Testnet
- **RPC Endpoint**: `https://api.avax.network/ext/bc/C/rpc`
- **Block Explorer**: `https://snowtrace.io/`

#### Technical Stack Integration
- **Frontend**: Wagmi + RainbowKit for wallet connection
- **Smart Contract Interaction**: Ethers.js for contract calls
- **Transaction Management**: Automatic gas estimation and confirmation handling
- **Fee Structure**: 1% platform fee with configurable fee wallet

#### Data Storage Pattern
- **On-Chain**: Prompt metadata, ownership, and transaction history
- **Off-Chain**: Image URLs and detailed descriptions (IPFS-ready)
- **Hybrid Approach**: Combines blockchain security with scalable storage

## Features & Overview

- **Discover & Explore**: Browse a curated collection of AI prompts across categories like Coding, Marketing, Creative Writing, and Business.
- **Sell & Share**: List and monetize your top AI prompts.
- **Interactive Chat**: Use our AI chatbox to get prompt recommendations and marketplace insights.
- **Responsive UI**: Built with Next.js, React, and Tailwind CSS for a seamless experience.
- **API Integration**: Easy integration with your applications via our RESTful API endpoints.

## 🛠️ Categories

- 📸 **Image Prompts**: For visual content generation
- 📝 **Text & Writing**: Creative writing, copywriting, and content creation
- 📊 **Marketing Copy**: Advertising, emails, and conversion-focused content
- 💡 **Creative Ideas**: Brainstorming and concept development
- 🚀 **Productivity Boosters**: Efficiency and workflow optimization
- 💻 **Code Generation**: Programming assistance and development

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **API Access**: External AI gateway (`https://secret-ai-gateway.onrender.com`)
- **AI Integration**: Google Gemini AI API
- **Authentication**: Wallet Connect for blockchain integration
- **Blockchain**: Avalanche Blockchain 
- **Smart Contracts**: Solidity with OpenZeppelin libraries
- **Web3 Integration**: Ethers.js, Wagmi, RainbowKit

## Prerequisites

- Node.js 20.9+ and npm
- Web browser with wallet extension (for blockchain features)
- MetaMask or other EVM-compatible wallet

## Installation

### Clone the Repository:
```sh
git clone https://github.com/obiajulu-gif/PromptHash
cd PromptHash
```

### Install Dependencies:
```sh
npm install
```

## Running the Application

### Start the Frontend
```sh
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## API Documentation

- **Gateway Docs**: [https://secret-ai-gateway.onrender.com/docs](https://secret-ai-gateway.onrender.com/docs)

## API Endpoints

### Models
#### `GET /api/models`
Retrieves available AI models.

### Chat
#### `GET /api/chat`
Chat with an AI model.

**Parameters:**
- `prompt`: The user's question or prompt.
- `model` (Optional): The AI model to use.

### Prompt Improvement
#### `POST /api/improve-prompt`
Analyze and improve a provided prompt.

**Body:**
- `prompt`: The prompt text to improve.

### Health Check
#### `GET /api/health`
Check the health status of the API.

## Usage Examples

### Chat with AI Model (JavaScript)
```js
const baseUrl = "https://secret-ai-gateway.onrender.com"
const params = new URLSearchParams({
  prompt: "Explain the benefits of Secret Network for AI applications",
  model: "gemini-2.5-flash"
})

const response = await fetch(`${baseUrl}/api/chat?${params.toString()}`)
const data = await response.json()
console.log(data)
```

## Project Structure
```
PromptHash/
├── src/
│   ├── web3/           # Smart contract ABI and configuration
│   │   ├── PromptHash.sol    # Solidity smart contract
│   │   ├── PromptHash.js     # Contract ABI and address
│   │   └── metadata.json     # Contract metadata
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and API calls
│   └── app/            # Next.js app router pages
├── package.json         # Node.js dependencies
└── README.md             # Project documentation
```

## Dependencies
Key dependencies include:
- **React, Next.js & Tailwind CSS**: For a responsive and intuitive frontend.
- **Lucide**: Icon library for UI components.
- **Ethers.js**: Ethereum library for smart contract interaction.
- **Wagmi**: React hooks for Ethereum.
- **RainbowKit**: Wallet connection UI components.
- **OpenZeppelin**: Secure smart contract libraries.

For a complete list, refer to `package.json`.

## Why Avalanche?

**Avalanche was chosen for its superior performance and developer experience:**

- **Speed**: Sub-second finality for instant transaction confirmation
- **Cost**: Low transaction fees (typically <$1) compared to Ethereum
- **Scalability**: High throughput without compromising decentralization
- **EVM Compatibility**: Full compatibility with Ethereum tools and libraries
- **Green**: More energy-efficient than proof-of-work blockchains
- **Developer Friendly**: Excellent documentation and growing ecosystem

## Getting Started with Avalanche

1. **Install MetaMask** or another EVM-compatible wallet
2. **Add Avalanche Network**:
   - Network Name: Avalanche C-Chain
   - RPC URL: `https://api.avax.network/ext/bc/C/rpc`
   - Chain ID: 43114
   - Symbol: AVAX
   - Explorer: `https://snowtrace.io/`
3. **Get Test AVAX** from the [Avalanche Faucet](https://faucet.avax.network/) for testing
4. **Connect your wallet** to start creating and trading prompts

## Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit pull requests or open issues for bugs and feature requests.

## License

This project is licensed under the MIT License.

## Demo Video
https://youtu.be/B6mLeXLl668
