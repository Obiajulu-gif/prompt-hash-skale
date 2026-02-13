"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  StarIcon,
  Filter,
  ArrowRight,
  Search,
  Eye,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useWriteContract } from "wagmi";
import { contractAddress, ABI } from "@/web3/PromptHash";
import { ethers } from "ethers";

interface Prompt {
  _id: string;
  title: string;
  content: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  owner: {
    username: string;
    walletAddress: string;
  };
  promptTokenId: number;
  createdAt: string;
}

export default function BrowsePage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState([0, 1]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [buyingPromptId, setBuyingPromptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address } = useAccount();
  const {
    data: hash,
    isPending: isContractPending,
    writeContract,
    error: contractError,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && buyingPromptId) {
      alert(`Prompt ${buyingPromptId} purchased successfully!`);
      setBuyingPromptId(null);
      setIsSubmitting(false);
      closeModal();
      // Optionally refresh the prompts list
      fetchPrompts();
    }
  }, [isConfirmed, buyingPromptId]);

  // Handle transaction errors
  useEffect(() => {
    if (contractError || confirmError) {
      console.error("Transaction error:", contractError || confirmError);
      alert(`Transaction failed: ${(contractError || confirmError)?.message}`);
      setIsSubmitting(false);
      setBuyingPromptId(null);
    }
  }, [contractError, confirmError]);

  const fetchPrompts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/prompts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch prompts");
      }

      setPrompts(data);
    } catch (error: any) {
      console.error("Error fetching prompts:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const buyPrompt = async (prompt: Prompt) => {
    if (!address) {
      alert("Please connect your wallet before proceeding");
      return;
    }

    if (!prompt.promptTokenId) {
      alert("Invalid prompt token ID");
      return;
    }

    // Check if user is trying to buy their own prompt
    if (prompt.owner.walletAddress.toLowerCase() === address.toLowerCase()) {
      alert("You cannot buy your own prompt");
      return;
    }

    setIsSubmitting(true);
    setBuyingPromptId(prompt.promptTokenId);

    try {
      // Convert price to wei (the value to send with the transaction)
      const priceInWei = ethers.parseEther((prompt.price*1.2).toString());

      // Buy the prompt - this is a payable function
      writeContract({
        address: contractAddress,
        abi: ABI,
        functionName: "buyPrompt",
        args: [prompt.promptTokenId],
        value: priceInWei, // Send the exact price as value
      });

    } catch (error: any) {
      console.error("Error buying prompt:", error);
      alert(`Failed to initiate transaction: ${error.message}`);
      setIsSubmitting(false);
      setBuyingPromptId(null);
    }
  };

  const openModal = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPrompt(null);
  };

  const getBuyButtonText = (promptTokenId: number) => {
    if (buyingPromptId === promptTokenId) {
      if (isContractPending) return "Confirming...";
      if (isConfirming) return "Processing...";
    }
    return "Buy Now";
  };

  const isBuyButtonDisabled = (prompt: Prompt) => {
    return (
      (isSubmitting && buyingPromptId === prompt.promptTokenId) ||
      (address && prompt.owner.walletAddress.toLowerCase() === address.toLowerCase())
    );
  };

  const getBuyButtonVariant = (prompt: Prompt) => {
    if (address && prompt.owner.walletAddress.toLowerCase() === address.toLowerCase()) {
      return "outline";
    }
    return "default";
  };

  const getBuyButtonLabel = (prompt: Prompt) => {
    if (!address) return "Connect Wallet";
    if (address && prompt.owner.walletAddress.toLowerCase() === address.toLowerCase()) {
      return "Your Prompt";
    }
    return getBuyButtonText(prompt.promptTokenId);
  };

  // Filter prompts based on search and category
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
    const matchesPrice = prompt.price >= priceRange[0] && prompt.price <= priceRange[1];

    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-foreground">
      <Navigation />
      <main className="flex-1 container py-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Filters Sidebar */}
          <aside className="w-full md:w-72 space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="bg-gray-900/60 border-gray-800 text-white">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                                     <SelectContent className="bg-gray-900 border-gray-800 text-white">
                     <SelectItem value="all">All Categories</SelectItem>
                     <SelectItem value="Creative Writing">Creative Writing</SelectItem>
                     <SelectItem value="Programming">Programming</SelectItem>
                     <SelectItem value="Marketing">Marketing</SelectItem>
                     <SelectItem value="Music">Music</SelectItem>
                     <SelectItem value="Gaming">Gaming</SelectItem>
                     <SelectItem value="Other">Other</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range (AVAX)</label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={100}
                  step={1}
                />
                                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{priceRange[0]} AVAX</span>
                    <span>{priceRange[1]} AVAX</span>
                  </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                                 <Select defaultValue="recent">
                   <SelectTrigger className="bg-gray-900/60 border-gray-800 text-white">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-gray-900 border-gray-800 text-white">
                     <SelectItem value="recent">Most Recent</SelectItem>
                     <SelectItem value="popular">Most Popular</SelectItem>
                     <SelectItem value="price-low">
                       Price: Low to High
                     </SelectItem>
                     <SelectItem value="price-high">
                       Price: High to Low
                     </SelectItem>
                   </SelectContent>
                 </Select>
              </div>
            </div>
          </aside>

          {/* Prompts Grid */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search prompts..."
                className="max-w-md bg-gray-900/60 border-gray-800 text-white placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="bg-primary hover:bg-primary/90">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">{error}</div>
            ) : filteredPrompts.length === 0 ? (
              <div className="text-center text-gray-400 p-4">
                No prompts found matching your criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrompts.map((prompt) => (
                  <Card
                    key={prompt._id}
                    className="group relative overflow-hidden transition-all hover:shadow-lg bg-gray-900 border-gray-800"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={prompt.image}
                        alt={prompt.title}
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      />
                      <Badge className="absolute top-2 right-2">
                        {prompt.category}
                      </Badge>
                      {address && prompt.owner.walletAddress.toLowerCase() === address.toLowerCase() && (
                        <Badge className="absolute top-2 left-2 bg-green-500">
                          Your Prompt
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{prompt.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {prompt.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-yellow-500">
                          <StarIcon className="h-4 w-4 fill-current" />
                          <span className="text-sm">{prompt.rating}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Seller: {prompt.owner.username}
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                      <span className="text-lg font-bold">
                        {prompt.price} AVAX
                      </span>
                      <Button className="bg-primary hover:bg-primary/90" onClick={() => openModal(prompt)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prompt Detail Modal */}
        {isModalOpen && selectedPrompt && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-950 border border-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedPrompt.title}</h2>
                  <button
                    onClick={closeModal}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                  <img
                    src={selectedPrompt.image}
                    alt={selectedPrompt.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-black/60 text-white">{selectedPrompt.category}</Badge>
                    <div className="flex items-center gap-1 text-yellow-500">
                    <StarIcon className="h-4 w-4 fill-current" />
                    <span>{selectedPrompt.rating}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {selectedPrompt.content}
                  </p>
                </div>

                                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Seller</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
                        {selectedPrompt.owner.username.charAt(0)}
                      </div>
                      <span>{selectedPrompt.owner.username}</span>
                    </div>
                  </div>

                {/* Transaction Status */}
                {buyingPromptId === selectedPrompt.promptTokenId && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      {isContractPending && "Waiting for wallet confirmation..."}
                      {isConfirming && "Processing purchase on blockchain..."}
                    </p>
                    {hash && (
                      <p className="text-xs text-blue-600 mt-1">
                        Transaction Hash: {hash}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {selectedPrompt.price} AVAX
                  </span>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => buyPrompt(selectedPrompt)}
                    disabled={isBuyButtonDisabled(selectedPrompt)}
                    variant={getBuyButtonVariant(selectedPrompt)}
                  >
                    {isBuyButtonDisabled(selectedPrompt) && isSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {getBuyButtonLabel(selectedPrompt)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}