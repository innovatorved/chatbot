export const DEFAULT_CHAT_MODEL: string = "chat-gemini-2.5-flash-lite";

interface ChatModel {
	id: string;
	name: string;
	description: string;
}

export const chatModels: Array<ChatModel> = [
	{
		id: "chat-gemini-2.5-flash-lite",
		name: "Gemini 2.5 Flash-Lite",
		description:
			"Best for high volume, cost efficient tasks. Ultra fast and optimized for cost-efficiency and high throughput",
	},
	{
		id: "chat-gemini-2.5-flash",
		name: "Gemini 2.5 Flash",
		description:
			"Best for fast performance on everyday tasks. Offers well-rounded capabilities with advanced thinking and native multimodality",
	},
	{
		id: "chat-gemini-2.0-flash",
		name: "Gemini 2.0 Flash",
		description:
			"Second generation workhorse model with 1 million token context window and multimodal capabilities",
	},
	{
		id: "chat-gemini-2.5-flash-search",
		name: "Gemini 2.5 Flash + Web Search",
		description:
			"Gemini 2.5 Flash with Google Search grounding for real-time information retrieval and enhanced accuracy",
	},
	{
		id: "chat-model-reasoning",
		name: "Qwen-3 32b",
		description: "Uses advanced reasoning and thinking for complex tasks",
	},
	{
		id: "openai/gpt-oss-20b",
		name: "GPT-OSS 20b",
		description: "Open source model by OpenAI, hosted on Groq",
	},
	{
		id: "openai/gpt-oss-120b",
		name: "GPT-OSS 120b",
		description: "Open source model by OpenAI, hosted on Groq",
	},
];
