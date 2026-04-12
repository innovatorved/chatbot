import {
	createDataStreamResponse,
	smoothStream,
	streamText,
	type UIMessage,
} from "ai";
import { auth } from "@/app/(auth)/auth";
import { isSelectableChatModelId } from "@/lib/ai/models";
import { myProvider } from "@/lib/ai/providers";
import { chatPostBodySchema } from "@/lib/api/chat-post-body";
import { isProductionEnvironment } from "@/lib/constants";
import { generateUUID, getMostRecentUserMessage } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(request: Request) {
	try {
		let json: unknown;
		try {
			json = await request.json();
		} catch {
			return new Response("Invalid JSON body", { status: 400 });
		}

		const parsed = chatPostBodySchema.safeParse(json);
		if (!parsed.success) {
			return new Response("Invalid request body", { status: 400 });
		}

		const { id, messages, selectedChatModel } = parsed.data;

		if (!isSelectableChatModelId(selectedChatModel)) {
			return new Response("Unsupported chat model", { status: 400 });
		}

		const uiMessages = messages as Array<UIMessage>;

		const session = await auth();

		if (!session || !session.user || !session.user.id) {
			return new Response("Unauthorized", { status: 401 });
		}

		const userMessage = getMostRecentUserMessage(uiMessages);

		if (!userMessage) {
			return new Response("No user message found", { status: 400 });
		}

		return createDataStreamResponse({
			execute: (dataStream) => {
				const result = streamText({
					model: myProvider.languageModel(selectedChatModel),
					messages: uiMessages,
					maxSteps: 5,
					system:
						id === "draft-emails"
							? draftEmails
							: id === "rephrase-text-professionally"
								? rephraseaTextProfessionally
								: "",

					experimental_transform: smoothStream({ chunking: "word" }),
					experimental_generateMessageId: generateUUID,
					experimental_telemetry: {
						isEnabled: isProductionEnvironment,
						functionId: "stream-text",
					},
				});

				result.consumeStream();

				result.mergeIntoDataStream(dataStream, {
					sendReasoning: true,
				});
			},
			onError: (error) => {
				console.error("Custom chat API Error:", error);
				return "An unexpected error occurred during the chat stream. Please try again.";
			},
		});
	} catch (error) {
		console.error("POST /api/chat/custom error:", error);
		return new Response("An error occurred while processing your request.", {
			status: 500,
		});
	}
}

const draftEmails = `
You are an expert email writing assistant, focused on crafting professional and empathetic messages. Follow these guidelines when composing emails:

TONE:
- Be warm yet professional
- Sound confident and authentic
- Show appreciation and respect

STRUCTURE:
- Opening: Hi [Name], I hope you're having a wonderful day!
- Body: Present your key message with enthusiasm
- Closing: End with next steps + warm wishes

TRANSFORMATIONS:
- "Deadline missed" → "Let's set a fresh timeline"
- "Problem with" → "Opportunity to enhance"
- "You must" → "I recommend"
- "I need" → "I would appreciate"

KEY RULE:
Always ask yourself: "Will this message make the reader feel valued and motivated?"
`;

const rephraseaTextProfessionally = `
You are an expert communication assistant. For every text:
Rephrase the text, correct the grammatic errors to make it more professional.
`;
