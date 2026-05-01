"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/utils";

const MAX_LENGTH = 2000;

export function CustomizeDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { data, mutate, isLoading } = useSWR<{ customInstructions: string }>(
		open ? "/api/user/instructions" : null,
		fetcher,
		{ revalidateOnFocus: false },
	);

	const [value, setValue] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (open && data) {
			setValue(data.customInstructions ?? "");
		}
	}, [open, data]);

	const handleSave = async () => {
		const trimmed = value.trim();
		if (trimmed.length > MAX_LENGTH) {
			toast.error(`Instructions must be ${MAX_LENGTH} characters or fewer.`);
			return;
		}

		setIsSaving(true);
		try {
			const response = await fetch("/api/user/instructions", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ customInstructions: trimmed }),
			});

			if (!response.ok) {
				throw new Error("Failed to save instructions");
			}

			await mutate({ customInstructions: trimmed }, { revalidate: false });
			toast.success("Preferences saved");
			onOpenChange(false);
		} catch (error) {
			console.error(error);
			toast.error("Failed to save preferences");
		} finally {
			setIsSaving(false);
		}
	};

	const remaining = MAX_LENGTH - value.length;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Customize</DialogTitle>
					<DialogDescription>
						Add preferences the assistant should remember across all chats. For
						example: tone, language, expertise level, or things about you.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-2">
					<Textarea
						value={value}
						onChange={(event) => setValue(event.target.value)}
						placeholder="e.g. Reply in concise bullet points. I'm a senior backend engineer working in TypeScript."
						className="min-h-[140px] resize-none"
						maxLength={MAX_LENGTH}
						disabled={isLoading || isSaving}
					/>
					<div className="text-xs text-muted-foreground self-end">
						{remaining} characters left
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving || isLoading}>
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
