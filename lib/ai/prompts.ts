export const regularPrompt =
	"You are a friendly assistant! Keep your responses concise and helpful.";

export const systemPrompt = ({
	selectedChatModel,
	customInstructions,
}: {
	selectedChatModel: string;
	customInstructions?: string | null;
}) => {
	const trimmed = customInstructions?.trim() ?? "";
	const memory =
		trimmed.length > 0
			? `\n\nUser preferences (always follow when reasonable):\n${trimmed}`
			: "";

	if (selectedChatModel === "chat-model-reasoning") {
		return regularPrompt + memory;
	}
	return `${regularPrompt}\n${memory}`;
};
