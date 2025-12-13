import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { memo } from "react";
import type { Vote } from "@/lib/db/schema";
import { PreviewMessage, ThinkingMessage } from "./message";
import { useScrollToBottom } from "./use-scroll-to-bottom";

interface MessagesProps {
	chatId: string;
	status: UseChatHelpers["status"];
	votes: Array<Vote>;
	messages: Array<UIMessage>;
	setMessages: UseChatHelpers["setMessages"];
	reload: UseChatHelpers["reload"];
	isReadonly: boolean;
	isPrivateMode?: boolean;
}

function PureMessages({
	chatId,
	status,
	votes,
	messages,
	setMessages,
	reload,
	isReadonly,
	isPrivateMode,
}: MessagesProps) {
	const [messagesContainerRef, messagesEndRef] =
		useScrollToBottom<HTMLDivElement>();

	const isStreaming = status === "streaming";
	const isSubmitted = status === "submitted";
	const lastMessageIsUser =
		messages.length > 0 && messages[messages.length - 1].role === "user";

	return (
		<div
			ref={messagesContainerRef}
			className="flex flex-col min-w-0 flex-1 overflow-y-scroll animate-fade-in-up"
		>
			{messages.map((message, index) => (
				<PreviewMessage
					key={message.id}
					chatId={chatId}
					message={message}
					isLoading={isStreaming && messages.length - 1 === index}
					vote={votes.find((vote) => vote.messageId === message.id)}
					setMessages={setMessages}
					reload={reload}
					isReadonly={isReadonly}
					isPrivateMode={isPrivateMode}
				/>
			))}

			{isSubmitted && lastMessageIsUser && <ThinkingMessage />}

			<div
				ref={messagesEndRef}
				className="shrink-0 min-w-[24px] min-h-[24px]"
			/>
		</div>
	);
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
	if (prevProps.status !== nextProps.status) return false;
	if (prevProps.messages.length !== nextProps.messages.length) return false;
	if (!equal(prevProps.messages, nextProps.messages)) return false;
	if (!equal(prevProps.votes, nextProps.votes)) return false;

	return true;
});
