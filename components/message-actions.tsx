import type { Message } from "ai";
import equal from "fast-deep-equal";
import type { Dispatch, SetStateAction } from "react";
import { memo } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { useCopyToClipboard } from "usehooks-ts";
import type { Vote } from "@/lib/db/schema";
import { CopyIcon, PencilEditIcon, ThumbDownIcon, ThumbUpIcon } from "./icons";
import { Button } from "./ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

const getTextFromMessage = (message: Message): string => {
	return (
		message.parts
			?.filter((part) => part.type === "text")
			.map((part) => part.text)
			.join("\n")
			.trim() || ""
	);
};

const handleVote = async (
	chatId: string,
	messageId: string,
	type: "up" | "down",
	mutate: ReturnType<typeof useSWRConfig>["mutate"],
) => {
	const voteRequest = fetch("/api/vote", {
		method: "PATCH",
		body: JSON.stringify({ chatId, messageId, type }),
	});

	toast.promise(voteRequest, {
		loading: `${type === "up" ? "Upvoting" : "Downvoting"} Response...`,
		success: () => {
			mutate<Array<Vote>>(
				`/api/vote?chatId=${chatId}`,
				(currentVotes) => {
					if (!currentVotes) return [];

					const votesWithoutCurrent = currentVotes.filter(
						(vote) => vote.messageId !== messageId,
					);

					return [
						...votesWithoutCurrent,
						{
							chatId,
							messageId,
							isUpvoted: type === "up",
						},
					];
				},
				{ revalidate: false },
			);

			return `${type === "up" ? "Upvoted" : "Downvoted"} Response!`;
		},
		error: `Failed to ${type === "up" ? "upvote" : "downvote"} response.`,
	});
};

export function PureMessageActions({
	chatId,
	message,
	vote,
	isLoading,
	setMode,
}: {
	chatId: string;
	message: Message;
	vote: Vote | undefined;
	isLoading: boolean;
	setMode?: Dispatch<SetStateAction<"view" | "edit">>;
}) {
	const { mutate } = useSWRConfig();
	const [_, copyToClipboard] = useCopyToClipboard();

	if (isLoading) return null;

	const handleCopy = async () => {
		const textFromParts = getTextFromMessage(message);

		if (!textFromParts) {
			toast.error("There's no text to copy!");
			return;
		}

		await copyToClipboard(textFromParts);
		toast.success("Copied to clipboard!");
	};

	// User message actions
	if (message.role === "user") {
		return (
			<TooltipProvider delayDuration={0}>
				<div className="flex flex-row gap-2">
					{setMode && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									data-testid="message-edit"
									className="py-1 px-2 h-fit text-muted-foreground"
									variant="ghost"
									onClick={() => setMode("edit")}
								>
									<PencilEditIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Edit Message</TooltipContent>
						</Tooltip>
					)}
				</div>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider delayDuration={0}>
			<div className="flex flex-row gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							className="py-1 px-2 h-fit text-muted-foreground"
							variant="ghost"
							onClick={handleCopy}
						>
							<CopyIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Copy</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							data-testid="message-upvote"
							className="py-1 px-2 h-fit text-muted-foreground pointer-events-auto!"
							disabled={vote?.isUpvoted}
							variant="ghost"
							onClick={() => handleVote(chatId, message.id, "up", mutate)}
						>
							<ThumbUpIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Upvote Response</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							data-testid="message-downvote"
							className="py-1 px-2 h-fit text-muted-foreground pointer-events-auto!"
							variant="ghost"
							disabled={vote && !vote.isUpvoted}
							onClick={() => handleVote(chatId, message.id, "down", mutate)}
						>
							<ThumbDownIcon />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Downvote Response</TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	);
}

export const MessageActions = memo(
	PureMessageActions,
	(prevProps, nextProps) => {
		if (!equal(prevProps.vote, nextProps.vote)) return false;
		if (prevProps.isLoading !== nextProps.isLoading) return false;
		if (prevProps.setMode !== nextProps.setMode) return false;

		return true;
	},
);
