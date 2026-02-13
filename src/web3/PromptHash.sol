// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract PromptHash is ERC721, Ownable, ReentrancyGuard {
    struct Prompt {
        string imageUrl;
        string description;
        uint256 price;
        bool forSale;
    }

    uint16 public constant MAX_FEE_BPS = 1000; // 10%
    uint16 public feeBps;
    address public feeWallet;

    uint256 private _nextTokenId = 1;
    uint256[] private _tokenIds;
    mapping(uint256 => Prompt) public prompts;

    event PromptCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string imageUrl,
        string description
    );
    event PromptListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event PromptSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    event FeeUpdated(uint16 newFeeBps);
    event FeeWalletUpdated(address newFeeWallet);

    constructor(address initialFeeWallet, uint16 initialFeeBps)
        ERC721("PromptHash", "PHASH")
        Ownable(msg.sender)
    {
        require(initialFeeWallet != address(0), "Invalid fee wallet");
        require(initialFeeBps <= MAX_FEE_BPS, "Fee too high");

        feeWallet = initialFeeWallet;
        feeBps = initialFeeBps;
    }

    function createPrompt(
        string calldata imageUrl,
        string calldata description
    ) external returns (uint256 tokenId) {
        require(bytes(imageUrl).length > 0, "Image URL cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");

        tokenId = _nextTokenId++;
        _tokenIds.push(tokenId);

        _safeMint(msg.sender, tokenId);
        prompts[tokenId] = Prompt({
            imageUrl: imageUrl,
            description: description,
            price: 0,
            forSale: false
        });

        emit PromptCreated(tokenId, msg.sender, imageUrl, description);
    }

    function listPromptForSale(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this prompt");
        require(price > 0, "Price must be greater than 0");

        Prompt storage prompt = prompts[tokenId];
        prompt.price = price;
        prompt.forSale = true;

        emit PromptListed(tokenId, msg.sender, price);
    }

    function buyPrompt(uint256 tokenId) external payable nonReentrant {
        address seller = ownerOf(tokenId);
        require(seller != msg.sender, "Cannot buy your own prompt");

        Prompt storage prompt = prompts[tokenId];
        require(prompt.forSale, "Prompt is not for sale");
        require(msg.value >= prompt.price, "Insufficient payment");

        uint256 salePrice = prompt.price;
        uint256 feeAmount = (salePrice * feeBps) / 10_000;
        uint256 sellerAmount = salePrice - feeAmount;

        prompt.forSale = false;
        prompt.price = 0;

        _transfer(seller, msg.sender, tokenId);

        _safeTransferNative(feeWallet, feeAmount);
        _safeTransferNative(seller, sellerAmount);

        if (msg.value > salePrice) {
            _safeTransferNative(msg.sender, msg.value - salePrice);
        }

        emit PromptSold(tokenId, seller, msg.sender, salePrice);
    }

    function getAllPrompts()
        external
        view
        returns (uint256[] memory tokenIds, Prompt[] memory allPrompts)
    {
        uint256 length = _tokenIds.length;
        tokenIds = new uint256[](length);
        allPrompts = new Prompt[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = _tokenIds[i];
            tokenIds[i] = tokenId;
            allPrompts[i] = prompts[tokenId];
        }
    }

    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function setFeeWallet(address newFeeWallet) external onlyOwner {
        require(newFeeWallet != address(0), "Invalid wallet address");
        feeWallet = newFeeWallet;
        emit FeeWalletUpdated(newFeeWallet);
    }

    function _safeTransferNative(address recipient, uint256 amount) private {
        if (amount == 0) {
            return;
        }
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Native transfer failed");
    }
}
