"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import { Button } from "./ui/button";

interface SuggestedActionsProps {
	chatId: string;
	append: UseChatHelpers["append"];
}

function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
	const suggestedActions = [
		{
			title: "What are the advantages",
			label: "of using Next.js?",
			action: "What are the advantages of using Next.js?",
		},
		{
			title: "Help me write an essay",
			label: "about silicon valley",
			action: "Help me write an essay about silicon valley",
		},
	];

	return (
		<div
			data-testid="suggested-actions"
			className="grid sm:grid-cols-2 gap-2 w-full"
		>
			{suggestedActions.map((suggestedAction, index) => (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					transition={{ delay: 0.05 * index }}
					key={`suggested-action-${suggestedAction.title}-${index}`}
					className={index > 1 ? "hidden sm:block" : "block"}
				>
					<Button
						variant="outline"
						onClick={async () => {
							window.history.replaceState({}, "", `/chat/${chatId}`);
							append({
								role: "user",
								content: suggestedAction.action,
							});
						}}
						className="text-left border rounded-2xl px-4 py-3 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start hover:bg-accent/50 transition-colors"
					>
						<span className="font-medium text-foreground">
							{suggestedAction.title}
						</span>
						<span className="text-muted-foreground text-xs">
							{suggestedAction.label}
						</span>
					</Button>
				</motion.div>
			))}
		</div>
	);
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
