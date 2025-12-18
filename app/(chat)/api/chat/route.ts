import {
	appendResponseMessages,
	createDataStreamResponse,
	smoothStream,
	streamText,
	type UIMessage,
} from "ai";
import { auth } from "@/app/(auth)/auth";
import { systemPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { isProductionEnvironment } from "@/lib/constants";
import {
	deleteChatById,
	getChatById,
	saveChat,
	saveMessages,
} from "@/lib/db/queries";
import {
	generateUUID,
	getMostRecentUserMessage,
	getTrailingMessageId,
} from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";

export const maxDuration = 60;

export async function POST(request: Request) {
	try {
		const {
			id,
			messages,
			selectedChatModel,
		}: {
			id: string;
			messages: Array<UIMessage>;
			selectedChatModel: string;
		} = await request.json();

		const session = await auth();

		if (!session || !session.user || !session.user.id) {
			return new Response("Unauthorized", { status: 401 });
		}

		const userMessage = getMostRecentUserMessage(messages);

		if (!userMessage) {
			return new Response("No user message found", { status: 400 });
		}

		const chat = await getChatById({ id });

		if (!chat) {
			try {
				const title = await generateTitleFromUserMessage({
					message: userMessage,
				});

				await saveChat({ id, userId: session.user.id, title });
			} catch (chatError) {
				console.error("Error saving chat:", chatError);
				// Continue even if chat save fails
			}
		} else {
			if (chat.userId !== session.user.id) {
				return new Response("Unauthorized", { status: 401 });
			}
		}

		await saveMessages({
			messages: [
				{
					chatId: id,
					id: userMessage.id,
					role: "user",
					parts: userMessage.parts,
					attachments: userMessage.experimental_attachments ?? [],
					createdAt: new Date(),
				},
			],
		});

		return createDataStreamResponse({
			execute: (dataStream) => {
				const hasAttachment = messages.some(
					(msg) =>
						msg.experimental_attachments &&
						msg.experimental_attachments.length > 0,
				);

				const result = streamText({
					model: myProvider.languageModel(selectedChatModel),
					system: hasAttachment
						? undefined
						: systemPrompt({ selectedChatModel }),
					messages,
					maxSteps: 5,
					experimental_transform: smoothStream({ chunking: "word" }),
					experimental_generateMessageId: generateUUID,
					onFinish: async ({ response }) => {
						if (session.user?.id) {
							try {
								const assistantId = getTrailingMessageId({
									messages: response.messages.filter(
										(message) => message.role === "assistant",
									),
								});

								if (!assistantId) {
									throw new Error("No assistant message found!");
								}

								const [, assistantMessage] = appendResponseMessages({
									messages: [userMessage],
									responseMessages: response.messages,
								});

								await saveMessages({
									messages: [
										{
											id: assistantId,
											chatId: id,
											role: assistantMessage.role,
											parts: assistantMessage.parts,
											attachments:
												assistantMessage.experimental_attachments ?? [],
											createdAt: new Date(),
										},
									],
								});
							} catch (_) {
								console.error("Failed to save chat");
							}
						}
					},
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
				console.error("Chat API Error:", error);
				return "An unexpected error occurred during the chat stream. Please try again.";
			},
		});
	} catch (error) {
		console.error("POST /api/chat error:", error);
		return new Response(
			error instanceof Error ? error.message : "An unexpected error occurred",
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return new Response("Not Found", { status: 404 });
	}

	const session = await auth();

	if (!session || !session.user) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		const chat = await getChatById({ id });

		if (chat.userId !== session.user.id) {
			return new Response("Unauthorized", { status: 401 });
		}

		await deleteChatById({ id });

		return new Response("Chat successfully deleted", { status: 200 });
	} catch (error) {
		console.error("DELETE /api/chat error:", error);
		return new Response(
			error instanceof Error ? error.message : "Failed to delete chat",
			{ status: 500 },
		);
	}
}
