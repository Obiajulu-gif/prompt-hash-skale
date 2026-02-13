// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract PromptHash is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    struct Prompt {
        string imageUrl;
        string description;
        uint256 price;
        bool forSale;
    }

    mapping(uint256 => Prompt) public prompts;
    uint256[] private _tokenIds; // Array to keep track of all token IDs
    uint256 private _tokenIdCounter;
    uint256 public feePercentage = 1; // 1% fee
    address public feeWallet =  0x4815A8Ba613a3eB21A920739dE4cA7C439c7e1b1; // Address to receive the fees

    event PromptCreated(uint256 indexed tokenId, address indexed creator, string imageUrl, string description);
    event PromptListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event PromptSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event FeeUpdated(uint256 newFeePercentage);
    event FeeWalletUpdated(address newFeeWallet);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _feeWallet) public initializer {
        __ERC721_init("PromptHash", "PHASH");
        __Ownable_init(msg.sender); // Pass the initial owner's address
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        _tokenIdCounter = 1;
        feeWallet = _feeWallet; // Set the fee wallet address
    }

    function createPrompt(string memory _imageUrl, string memory _description) external returns (uint256) {
        require(bytes(_imageUrl).length > 0, "Image URL cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _tokenIds.push(tokenId); // Add the new token ID to the array

        _safeMint(msg.sender, tokenId);

        prompts[tokenId] = Prompt({
            imageUrl: _imageUrl,
            description: _description,
            price: 0,
            forSale: false
        });

        emit PromptCreated(tokenId, msg.sender, _imageUrl, _description);
        return tokenId;
    }

    function listPromptForSale(uint256 _tokenId, uint256 _price) external {
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of this prompt");
        require(_price > 0, "Price must be greater than 0");

        prompts[_tokenId].price = _price;
        prompts[_tokenId].forSale = true;

        emit PromptListed(_tokenId, msg.sender, _price);
    }

    function buyPrompt(uint256 _tokenId) external payable nonReentrant {
        require(ownerOf(_tokenId) != address(0), "Prompt does not exist");
        require(prompts[_tokenId].forSale, "Prompt is not for sale");
        require(msg.value >= prompts[_tokenId].price, "Insufficient payment");
        require(ownerOf(_tokenId) != msg.sender, "Cannot buy your own prompt");

        address seller = ownerOf(_tokenId);
        uint256 salePrice = prompts[_tokenId].price;

        // Calculate the fee
        uint256 fee = (salePrice * feePercentage) / 100;
        uint256 sellerAmount = salePrice - fee;

        prompts[_tokenId].forSale = false;
        prompts[_tokenId].price = 0;

        _transfer(seller, msg.sender, _tokenId);

        // Transfer the fee to the fee wallet
        payable(feeWallet).transfer(fee);
        // Transfer the remaining amount to the seller
        payable(seller).transfer(sellerAmount);

        // Refund excess payment
        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }

        emit PromptSold(_tokenId, seller, msg.sender, salePrice);
    }

    function getAllPrompts() external view returns (uint256[] memory, Prompt[] memory) {
        uint256[] memory tokenIds = new uint256[](_tokenIds.length);
        Prompt[] memory allPrompts = new Prompt[](_tokenIds.length);

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            tokenIds[i] = _tokenIds[i];
            allPrompts[i] = prompts[_tokenIds[i]];
        }

        return (tokenIds, allPrompts);
    }

    function setFeePercentage(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 10, "Fee percentage cannot exceed 10%");
        feePercentage = _newFeePercentage;
        emit FeeUpdated(_newFeePercentage);
    }

    function setFeeWallet(address _newFeeWallet) external onlyOwner {
        require(_newFeeWallet != address(0), "Invalid wallet address");
        feeWallet = _newFeeWallet;
        emit FeeWalletUpdated(_newFeeWallet);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // This function is required for UUPS upgradeable contracts
    }
}