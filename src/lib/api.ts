// API client for interacting with the AI gateway

// Base URL for the API
const API_BASE_URL = "https://secret-ai-gateway.onrender.com";

// Available models (Render API)
export type AIModel = "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-2.0-flash";
export type ImageModel = "gemini-2.0-flash-exp-image-generation" | "gemini-2.0-flash-preview-image-generation";

// Function to get available models
export async function getModels() {
	try {
		const response = await fetch(`${API_BASE_URL}/api/models`, {
			headers: {
				"Accept": "application/json"
			}
		});
		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error("Error fetching models:", error);
		return { models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"] };
	}
}

// Function to check API health
export async function checkHealth() {
	try {
		const response = await fetch(`${API_BASE_URL}/api/health`, {
			headers: {
				Accept: "application/json",
			},
		});
		return response.ok;
	} catch (error) {
		console.error("Health check failed:", error);
		return false;
	}
}

// Function to get chat response
export async function getChatResponse(
	prompt: string,
	model: AIModel = "gemini-2.5-flash"
) {
	try {
		const q = new URLSearchParams({ prompt, model });
		const response = await fetch(`${API_BASE_URL}/api/chat?${q.toString()}`, {
			method: "GET",
			headers: {
				Accept: "application/json",
			},
			cache: "no-store",
			credentials: "omit",
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Chat API error: ${response.status}`, errorText);
			throw new Error(`Chat API error: ${response.status}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Error getting chat response:", error);
		throw error;
	}
}

// Generate image (GET)
export async function generateImage(
	prompt: string,
	model: ImageModel = "gemini-2.0-flash-preview-image-generation"
) {
	try {
		const q = new URLSearchParams({ prompt, model });
		const response = await fetch(`${API_BASE_URL}/api/generate/image?${q.toString()}`, {
			method: "GET",
			headers: { Accept: "application/json" },
			cache: "no-store",
			credentials: "omit",
		});
		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Generate image API error: ${response.status}`, errorText);
			throw new Error(`Generate image API error: ${response.status}`);
		}
		const result = await response.json();
		return result?.response as string;
	} catch (error) {
		console.error("Error generating image:", error);
		throw error;
	}
}

// Improve prompt (try GET first, then fallback to POST)
export async function improvePrompt(prompt: string, target: "text" | "image" = "text") {
	// Try GET route
	try {
		const q = new URLSearchParams({ prompt, target });
		const res = await fetch(`${API_BASE_URL}/api/improve-prompt?${q.toString()}`, {
			method: "GET",
			headers: { Accept: "application/json" },
			cache: "no-store",
			credentials: "omit",
		});
		if (res.ok) {
			const result = await res.json();
			if (typeof result === "string") return result;
			if (result?.response) return result.response;
			if (result?.prompt) return result.prompt;
			if (result?.improved) return result.improved;
		}
	} catch (e) {
		console.warn("GET improve-prompt failed, trying POST...");
	}

	// Fallback to POST
	try {
		const response = await fetch(`${API_BASE_URL}/api/improve-prompt`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ prompt, target }),
			cache: "no-store",
			credentials: "omit",
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Improve prompt API error: ${response.status}`, errorText);
			return prompt;
		}

		const result = await response.json();
		if (typeof result === "string") return result;
		if (result?.response) return result.response;
		if (result?.prompt) return result.prompt;
		if (result?.improved) return result.improved;
		return prompt;
	} catch (error) {
		console.error("Error improving prompt:", error);
		return prompt;
	}
}

// Backward-compatible alias used by existing form components.
export async function improvePromptText(prompt: string, target: "text" | "image" = "text") {
	return improvePrompt(prompt, target);
}
