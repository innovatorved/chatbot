import { google } from "@ai-sdk/google";

import { createGroq } from "@ai-sdk/groq";
import {
	customProvider,
	extractReasoningMiddleware,
	wrapLanguageModel,
} from "ai";

const groq = createGroq({
	baseURL:
		"https://gateway.ai.cloudflare.com/v1/b4ca0337fb21e846c53e1f2611ba436c/chatbot-ai/groq",
});

export const myProvider = customProvider({
	languageModels: {
		"chat-gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
		"chat-gemini-2.5-flash": google("gemini-2.5-flash"),
		"chat-gemini-2.5-flash-search": google("gemini-2.5-flash-lite", {
			useSearchGrounding: true,
		}),
		"chat-gemini-2.0-flash": google("gemini-2.0-flash"),
		"chat-model-reasoning": wrapLanguageModel({
			model: groq("qwen/qwen3-32b"),
			middleware: extractReasoningMiddleware({ tagName: "think" }),
		}),
		"title-model": google("gemini-2.5-flash-lite"),
		"openai/gpt-oss-20b": groq("openai/gpt-oss-20b"),
		"openai/gpt-oss-120b": wrapLanguageModel({
			model: groq("openai/gpt-oss-120b"),
			middleware: extractReasoningMiddleware({ tagName: "think" }),
		}),
	},
	imageModels: {},
});
