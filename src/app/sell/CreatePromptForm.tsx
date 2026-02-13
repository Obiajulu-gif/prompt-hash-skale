import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, DollarSign, Wand2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useWriteContract } from "wagmi";
import { contractAddress, ABI } from "@/web3/PromptHash";
import { improvePromptText } from "@/lib/api";

interface FormData {
  image: string;
  title: string;
  content: string;
  category: string;
  price: string;
  rating: string;
}

export function CreatePromptForm() {
  const { address } = useAccount();
  const [submitted, setSubmitted] = useState(false);

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

  const [formData, setFormData] = useState<FormData>({
    image: "",
    title: "",
    content: "",
    category: "",
    price: "3",
    rating: "3",
  });

  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatabaseSaving, setIsDatabaseSaving] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [transactionStep, setTransactionStep] = useState<'idle' | 'blockchain' | 'database' | 'complete'>('idle');

  // Function to improve the prompt content
  const handleImprovePrompt = async () => {
    if (!formData.content.trim()) {
      alert("Please enter some content first before improving it.");
      return;
    }

    setIsImproving(true);

    try {
      const improvedContent = await improvePromptText(formData.content, 'text');
      
      if (improvedContent && improvedContent !== formData.content) {
        setFormData(prev => ({ ...prev, content: improvedContent }));
        // Clear any existing content errors since we now have improved content
        if (errors.content) {
          setErrors(prev => ({ ...prev, content: null }));
        }
      } else {
        alert("Unable to improve the prompt. Please try again or modify it manually.");
      }
    } catch (error) {
      console.error("Error improving prompt:", error);
      alert("Failed to improve prompt. Please try again.");
    } finally {
      setIsImproving(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: null }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.image.trim()) newErrors.image = "Image URL is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (formData.title.length < 3)
      newErrors.title = "Title must be at least 3 characters";
    if (!formData.content.trim()) newErrors.content = "Content is required";
    if (formData.content.length < 10)
      newErrors.content = "Content must be at least 10 characters";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = "Price must be a positive number";
    }
    if (!formData.rating) newErrors.rating = "Rating is required";
    if (Number(formData.rating) < 1 || Number(formData.rating) > 5) {
      newErrors.rating = "Rating must be between 1 and 5";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save to database after blockchain confirmation
  const saveToDatabase = async () => {
    setIsDatabaseSaving(true);
    setTransactionStep('database');

    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: formData.image,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          price: Number(formData.price),
          rating: Number(formData.rating),
          walletAddress: address,
          transactionHash: hash, // Include the blockchain transaction hash
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to save to database");
      }

      // Success! Reset form and show message
      setFormData({
        image: "",
        title: "",
        content: "",
        category: "",
        price: "0.001",
        rating: "3",
      });

      setTransactionStep('complete');

    } catch (error: any) {
      console.error("Database save error:", error);
      alert(`Blockchain transaction successful, but database save failed: ${error.message}`);
    } finally {
      setIsDatabaseSaving(false);
      setIsSubmitting(false);
      setSubmitted(false);
    }
  };

  // Monitor blockchain transaction status
  useEffect(() => {
    if (isConfirmed && submitted) {
      // Transaction confirmed on blockchain, now save to database
      saveToDatabase();
    }
  }, [isConfirmed, submitted]);

  // Handle contract or confirmation errors
  useEffect(() => {
    if (contractError || confirmError) {
      console.error("Transaction error:", contractError || confirmError);
      alert(`Transaction failed: ${(contractError || confirmError)?.message}`);
      setIsSubmitting(false);
      setSubmitted(false);
      setTransactionStep('idle');
    }
  }, [contractError, confirmError]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!address) {
      alert("Please connect your wallet before proceeding");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setTransactionStep('blockchain');

    try {
      // First, initiate blockchain transaction
      writeContract({
        address: contractAddress,
        abi: ABI,
        functionName: "createPrompt",
        args: [formData.image, formData.title],
      });

      setSubmitted(true);
    } catch (error: any) {
      console.error("Error initiating blockchain transaction:", error);
      alert(`Failed to initiate transaction: ${error.message}`);
      setIsSubmitting(false);
      setTransactionStep('idle');
    }
  };

  // Get current status message
  const getStatusMessage = () => {
    switch (transactionStep) {
      case 'blockchain':
        return isContractPending
          ? "Waiting for approval..."
          : isConfirming
            ? "Confirming transaction..."
            : "Processing...";
      case 'database':
        return "Saving prompt...";
      case 'complete':
        return "Prompt created successfully!";
      default:
        return isSubmitting ? "Processing..." : "Create Prompt";
    }
  };

  const isProcessing = isSubmitting || isContractPending || isConfirming || isDatabaseSaving;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Transaction Status */}
      {transactionStep !== 'idle' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {getStatusMessage()}
          </p>
          {hash && (
            <p className="text-xs text-blue-600 mt-1">
              Transaction Hash: {hash}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Image URL</label>
          <Input
            placeholder="Enter image URL"
            name="image"
            value={formData.image}
            onChange={handleChange}
            className={`${errors.image ? "border-red-500" : "border-purple-400"} bg-gray-900/60 border-gray-800 text-foreground placeholder:text-gray-500`}
            disabled={isProcessing}
          />
          {errors.image && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.image}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            placeholder="Enter prompt title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`${errors.title ? "border-red-500" : "border-purple-400"} bg-gray-900/60 border-gray-800 text-foreground placeholder:text-gray-500`}
            disabled={isProcessing}
          />
          {errors.title && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.title}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Content</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImprovePrompt}
            disabled={isProcessing || isImproving || !formData.content.trim()}
            className="flex items-center gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            {isImproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {isImproving ? "Improving..." : "Improve Prompt"}
          </Button>
        </div>
        <Textarea
          placeholder="Enter prompt content..."
          name="content"
          value={formData.content}
          onChange={handleChange}
          className={`${errors.content ? "border-red-500" : "border-purple-400"} bg-gray-900/60 border-gray-800 text-foreground placeholder:text-gray-500`}
          rows={4}
          disabled={isProcessing}
        />
        {errors.content && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.content}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Use the \"Improve Prompt\" button to enhance your content with AI suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={formData.category}
            onValueChange={handleCategoryChange}
            disabled={isProcessing}
          >
            <SelectTrigger
              className={`${errors.category ? "border-red-500" : "border-purple-400"} bg-gray-900/60 border-gray-800 text-foreground`}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Creative Writing">Creative Writing</SelectItem>
              <SelectItem value="Programming">Programming</SelectItem>
              <SelectItem value="Music">Music</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.category}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Price (AVAX)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="0.00"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="1"
              min={0.0001}
              max={1000}
              className={`pl-9 ${errors.price ? "border-red-500" : "border-purple-400"} bg-gray-900/60 border-gray-800 text-foreground placeholder:text-gray-500`}
              disabled={isProcessing}
            />
          </div>
          {errors.price && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.price}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Rating (1-5)</label>
        <Input
          type="number"
          placeholder="1"
          name="rating"
          value={formData.rating}
          onChange={handleChange}
          min="1"
          max="5"
          className={`${errors.rating ? "border-red-500" : "border-purple-400"} bg-gray-900/60 border-gray-800 text-foreground placeholder:text-gray-500`}
          disabled={isProcessing}
        />
        {errors.rating && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.rating}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isProcessing}>
        {getStatusMessage()}
      </Button>
    </form>
  );
}