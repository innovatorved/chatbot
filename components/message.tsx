"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";
import type { Vote } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { QuestionIcon } from "./icons";
import { Markdown } from "./markdown";
import { MessageActions } from "./message-actions";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";

const PurePreviewMessage = ({
	chatId,
	message,
	vote,
	isLoading,
	setMessages,
	reload,
	isReadonly,
	isPrivateMode,
}: {
	chatId: string;
	message: UIMessage;
	vote: Vote | undefined;
	isLoading: boolean;
	setMessages: UseChatHelpers["setMessages"];
	reload: UseChatHelpers["reload"];
	isReadonly: boolean;
	isPrivateMode?: boolean;
}) => {
	const [mode, setMode] = useState<"view" | "edit">("view");

	return (
		<AnimatePresence>
			<motion.div
				data-testid={`message-${message.role}`}
				className={cn("w-full group/message py-6 px-4")}
				initial={{ y: 5, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				data-role={message.role}
			>
				<div
					className={cn(
						"flex gap-3 w-full max-w-3xl mx-auto items-start",
						message.role === "user"
							? "flex-row-reverse justify-start"
							: "justify-start",
					)}
				>
					{message.role === "assistant" && (
						<div className="size-7 flex items-center rounded-full justify-center shrink-0 text-muted-foreground mt-0.5">
							<QuestionIcon />
						</div>
					)}

					<div
						className={cn(
							"flex flex-col gap-2 min-w-0",
							message.role === "user"
								? "items-end max-w-[85%] ml-auto"
								: "w-full",
						)}
					>
						{message.experimental_attachments && (
							<div
								data-testid={`message-attachments`}
								className="flex flex-row justify-end gap-2"
							>
								{message.experimental_attachments.map((attachment) => (
									<PreviewAttachment
										key={attachment.url}
										attachment={attachment}
									/>
								))}
							</div>
						)}

						{message.parts?.map((part, index) => {
							const { type } = part;
							const key = `message-${message.id}-part-${index}`;

							if (type === "reasoning") {
								return (
									<MessageReasoning
										key={key}
										isLoading={isLoading}
										reasoning={part.reasoning}
									/>
								);
							}

							if (type === "text") {
								if (mode === "view") {
									return (
										<div key={key} className="flex flex-col gap-2">
											<div
												data-testid="message-content"
												className={cn(
													"flex flex-col gap-4",
													message.role === "user"
														? "bg-primary text-primary-foreground px-4 py-3 rounded-4xl w-fit"
														: "text-foreground w-full",
												)}
											>
												<Markdown>{part.text}</Markdown>
											</div>
										</div>
									);
								}

								if (mode === "edit") {
									return (
										<MessageEditor
											key={message.id}
											message={message}
											setMode={setMode}
											setMessages={setMessages}
											reload={reload}
											isPrivateMode={isPrivateMode}
										/>
									);
								}
							}

							if (type === "tool-invocation") {
								const { toolInvocation } = part;
								const { toolCallId, state } = toolInvocation;

								if (state === "call") {
									return <div key={toolCallId}>No Tool Configured</div>;
								}

								if (state === "result") {
									const { result } = toolInvocation;

									return (
										<div key={toolCallId}>
											<pre>{JSON.stringify(result, null, 2)}</pre>
										</div>
									);
								}
							}

							return null;
						})}

						{!isReadonly && (
							<MessageActions
								key={`action-${message.id}`}
								chatId={chatId}
								message={message}
								vote={vote}
								isLoading={isLoading}
								setMode={setMode}
							/>
						)}
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export const PreviewMessage = memo(
	PurePreviewMessage,
	(prevProps, nextProps) => {
		if (prevProps.isLoading !== nextProps.isLoading) return false;
		if (prevProps.message.id !== nextProps.message.id) return false;
		if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
		if (!equal(prevProps.vote, nextProps.vote)) return false;

		return true;
	},
);

export const ThinkingMessage = () => {
	return (
		<motion.div
			data-testid="message-assistant-loading"
			className="w-full bg-background py-6 px-4"
			initial={{ y: 5, opacity: 0 }}
			animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
			data-role="assistant"
		>
			<div className="flex gap-3 w-full max-w-3xl mx-auto items-start">
				<div className="size-7 flex items-center rounded-full justify-center shrink-0 text-muted-foreground mt-0.5">
					<QuestionIcon />
				</div>

				<div className="flex flex-col gap-2 w-full text-muted-foreground">
					Thinking...
				</div>
			</div>
		</motion.div>
	);
};
