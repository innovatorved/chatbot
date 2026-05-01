"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { Search, Star, StarOff } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import {
	CheckCircleFillIcon,
	GlobeIcon,
	LockIcon,
	MoreHorizontalIcon,
	ShareIcon,
	TrashIcon,
} from "@/components/icons";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";

type GroupedChats = {
	today: Chat[];
	yesterday: Chat[];
	lastWeek: Chat[];
	lastMonth: Chat[];
	older: Chat[];
};

const BaseChatItem = ({
	chat,
	isActive,
	onDelete,
	onPinToggle,
	setOpenMobile,
	enableDelete = true,
	enableShare = true,
	enablePin = false,
}: {
	chat: {
		id: string;
		title: string;
		visibility?: "private" | "public";
		isPinned?: boolean;
	};
	isActive: boolean;
	onDelete?: (chatId: string) => void;
	onPinToggle?: (chatId: string, nextPinned: boolean) => void;
	setOpenMobile: (open: boolean) => void;
	enableDelete?: boolean;
	enableShare?: boolean;
	enablePin?: boolean;
}) => {
	const { visibilityType, setVisibilityType } = useChatVisibility({
		chatId: chat.id,
		initialVisibility: chat.visibility || "private",
	});

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={isActive}>
				<Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
					<span>{chat.title}</span>
				</Link>
			</SidebarMenuButton>

			<DropdownMenu modal={true}>
				<DropdownMenuTrigger asChild>
					<SidebarMenuAction
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
						showOnHover={!isActive}
					>
						<MoreHorizontalIcon />
						<span className="sr-only">More</span>
					</SidebarMenuAction>
				</DropdownMenuTrigger>

				<DropdownMenuContent side="bottom" align="end">
					{enablePin && onPinToggle && (
						<DropdownMenuItem
							className="cursor-pointer"
							onSelect={() => onPinToggle(chat.id, !chat.isPinned)}
						>
							{chat.isPinned ? (
								<>
									<StarOff className="size-3" />
									<span>Unpin</span>
								</>
							) : (
								<>
									<Star className="size-3" />
									<span>Pin</span>
								</>
							)}
						</DropdownMenuItem>
					)}

					{enableShare && (
						<DropdownMenuSub>
							<DropdownMenuSubTrigger className="cursor-pointer">
								<ShareIcon />
								<span>Share</span>
							</DropdownMenuSubTrigger>
							<DropdownMenuPortal>
								<DropdownMenuSubContent>
									<DropdownMenuItem
										className="cursor-pointer flex-row justify-between"
										onClick={() => setVisibilityType("private")}
									>
										<div className="flex flex-row gap-2 items-center">
											<LockIcon size={12} />
											<span>Private</span>
										</div>
										{visibilityType === "private" ? (
											<CheckCircleFillIcon />
										) : null}
									</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer flex-row justify-between"
										onClick={() => setVisibilityType("public")}
									>
										<div className="flex flex-row gap-2 items-center">
											<GlobeIcon />
											<span>Public</span>
										</div>
										{visibilityType === "public" ? (
											<CheckCircleFillIcon />
										) : null}
									</DropdownMenuItem>
								</DropdownMenuSubContent>
							</DropdownMenuPortal>
						</DropdownMenuSub>
					)}

					{enableDelete && onDelete && (
						<DropdownMenuItem
							className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
							onSelect={() => onDelete(chat.id)}
						>
							<TrashIcon />
							<span>Delete</span>
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
};

const PureChatItem = ({
	chat,
	isActive,
	onDelete,
	onPinToggle,
	setOpenMobile,
}: {
	chat: Chat;
	isActive: boolean;
	onDelete: (chatId: string) => void;
	onPinToggle: (chatId: string, nextPinned: boolean) => void;
	setOpenMobile: (open: boolean) => void;
}) => (
	<BaseChatItem
		chat={chat}
		isActive={isActive}
		onDelete={onDelete}
		onPinToggle={onPinToggle}
		setOpenMobile={setOpenMobile}
		enablePin
	/>
);

const UnPureChatItem = ({
	chat,
	isActive,
	setOpenMobile,
}: {
	chat: {
		id: string;
		title: string;
	};
	isActive: boolean;
	setOpenMobile: (open: boolean) => void;
}) => (
	<BaseChatItem
		chat={chat}
		isActive={isActive}
		setOpenMobile={setOpenMobile}
		enableDelete={false}
		enableShare={false}
	/>
);

export const CustomChatItem = memo(UnPureChatItem, (prevProps, nextProps) => {
	if (prevProps.isActive !== nextProps.isActive) return false;
	return true;
});

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
	if (prevProps.isActive !== nextProps.isActive) return false;
	if (prevProps.chat.isPinned !== nextProps.chat.isPinned) return false;
	if (prevProps.chat.title !== nextProps.chat.title) return false;
	return true;
});

export function SidebarHistory({ user }: { user: User | undefined }) {
	const { setOpenMobile } = useSidebar();
	const { id } = useParams();
	const _pathname = usePathname();
	const {
		data: history,
		isLoading,
		mutate,
	} = useSWR<Array<Chat>>(user ? "/api/history" : null, fetcher, {
		fallbackData: [],
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	});

	const [deleteId, setDeleteId] = useState<string | null>(null);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [query, setQuery] = useState("");
	const router = useRouter();

	const trimmedQuery = query.trim().toLowerCase();
	const isSearching = trimmedQuery.length > 0;

	const filteredHistory = useMemo(() => {
		if (!history) return [];
		if (!isSearching) return history;
		return history.filter((c) => c.title.toLowerCase().includes(trimmedQuery));
	}, [history, isSearching, trimmedQuery]);

	const pinnedChats = useMemo(
		() => (history ?? []).filter((c) => c.isPinned),
		[history],
	);

	const handlePinToggle = async (chatId: string, nextPinned: boolean) => {
		mutate(
			(current) =>
				current?.map((c) =>
					c.id === chatId ? { ...c, isPinned: nextPinned } : c,
				),
			{ revalidate: false },
		);

		try {
			const response = await fetch("/api/chat/pin", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chatId, isPinned: nextPinned }),
			});

			if (!response.ok) {
				throw new Error("Failed to update pin state");
			}
			void mutate();
		} catch (error) {
			console.error(error);
			toast.error("Failed to update pin state");
			mutate(
				(current) =>
					current?.map((c) =>
						c.id === chatId ? { ...c, isPinned: !nextPinned } : c,
					),
				{ revalidate: false },
			);
		}
	};

	const handleDelete = async () => {
		const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
			method: "DELETE",
		});

		toast.promise(deletePromise, {
			loading: "Deleting chat...",
			success: () => {
				mutate((history) => {
					if (history) {
						return history.filter((h) => h.id !== id);
					}
				});
				return "Chat deleted successfully";
			},
			error: "Failed to delete chat",
		});

		setShowDeleteDialog(false);

		if (deleteId === id) {
			router.push("/");
		}
	};

	if (!user) {
		return (
			<SidebarGroup>
				<SidebarGroupContent>
					<div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
						Login to save and revisit previous chats!
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	const customChats = [
		{
			id: "draft-emails",
			title: "Draft Professional Emails",
		},
		{
			id: "rephrase-text-professionally",
			title: "Rephrase Text Professionally",
		},
	];

	const searchBox = (
		<div className="px-2 pb-1">
			<div className="relative">
				<Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
				<Input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search chats..."
					aria-label="Search chats"
					className="h-8 pl-7 text-sm bg-sidebar-accent/40 border-transparent focus-visible:ring-1"
				/>
			</div>
		</div>
	);

	if (isLoading) {
		return (
			<SidebarGroup>
				{searchBox}
				<div className="px-2 py-1 text-xs text-sidebar-foreground/50">
					Today
				</div>
				<SidebarGroupContent>
					<div className="flex flex-col">
						{[44, 32, 28, 64, 52].map((item) => (
							<div
								key={item}
								className="rounded-md h-8 flex gap-2 px-2 items-center"
							>
								<div
									className="h-4 rounded-md flex-1 max-w-(--skeleton-width) bg-sidebar-accent-foreground/10"
									style={
										{
											"--skeleton-width": `${item}%`,
										} as React.CSSProperties
									}
								/>
							</div>
						))}
					</div>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	if (history?.length === 0) {
		return (
			<SidebarGroup>
				{searchBox}
				<SidebarGroupContent>
					<SidebarMenu>
						<div className="px-2 py-1 text-xs text-sidebar-foreground/50">
							Custom Modules
						</div>
						{customChats.map((chat) => (
							<CustomChatItem
								key={chat.id}
								chat={chat}
								isActive={chat.id === id}
								setOpenMobile={setOpenMobile}
							/>
						))}
						<div className="px-2 py-3 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
							Your conversations will appear here once you start chatting!
						</div>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	}

	const groupChatsByDate = (chats: Chat[]): GroupedChats => {
		const now = new Date();
		const oneWeekAgo = subWeeks(now, 1);
		const oneMonthAgo = subMonths(now, 1);

		return chats.reduce(
			(groups, chat) => {
				const chatDate = new Date(chat.createdAt);

				if (isToday(chatDate)) {
					groups.today.push(chat);
				} else if (isYesterday(chatDate)) {
					groups.yesterday.push(chat);
				} else if (chatDate > oneWeekAgo) {
					groups.lastWeek.push(chat);
				} else if (chatDate > oneMonthAgo) {
					groups.lastMonth.push(chat);
				} else {
					groups.older.push(chat);
				}

				return groups;
			},
			{
				today: [],
				yesterday: [],
				lastWeek: [],
				lastMonth: [],
				older: [],
			} as GroupedChats,
		);
	};

	const onDeleteChat = (chatId: string) => {
		setDeleteId(chatId);
		setShowDeleteDialog(true);
	};

	return (
		<>
			<SidebarGroup>
				{searchBox}
				<SidebarGroupContent>
					<SidebarMenu>
						{isSearching ? (
							<>
								<div className="px-2 py-1 text-xs text-sidebar-foreground/50">
									Results ({filteredHistory.length})
								</div>
								{filteredHistory.length === 0 ? (
									<div className="px-2 py-3 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
										No matching chats
									</div>
								) : (
									filteredHistory.map((chat) => (
										<ChatItem
											key={chat.id}
											chat={chat}
											isActive={chat.id === id}
											onDelete={onDeleteChat}
											onPinToggle={handlePinToggle}
											setOpenMobile={setOpenMobile}
										/>
									))
								)}
							</>
						) : (
							history &&
							(() => {
								const unpinned = history.filter((c) => !c.isPinned);
								const groupedChats = groupChatsByDate(unpinned);

								return (
									<>
										<div className="px-2 py-1 text-xs text-sidebar-foreground/50">
											Custom Modules
										</div>
										{customChats.map((chat) => (
											<CustomChatItem
												key={chat.id}
												chat={chat}
												isActive={chat.id === id}
												setOpenMobile={setOpenMobile}
											/>
										))}

										{pinnedChats.length > 0 && (
											<>
												<div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
													Pinned
												</div>
												{pinnedChats.map((chat) => (
													<ChatItem
														key={chat.id}
														chat={chat}
														isActive={chat.id === id}
														onDelete={onDeleteChat}
														onPinToggle={handlePinToggle}
														setOpenMobile={setOpenMobile}
													/>
												))}
											</>
										)}

										{groupedChats.today.length > 0 && (
											<>
												<div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
													Today
												</div>
												{groupedChats.today.map((chat) => (
													<ChatItem
														key={chat.id}
														chat={chat}
														isActive={chat.id === id}
														onDelete={onDeleteChat}
														onPinToggle={handlePinToggle}
														setOpenMobile={setOpenMobile}
													/>
												))}
											</>
										)}

										{groupedChats.yesterday.length > 0 && (
											<>
												<div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
													Yesterday
												</div>
												{groupedChats.yesterday.map((chat) => (
													<ChatItem
														key={chat.id}
														chat={chat}
														isActive={chat.id === id}
														onDelete={onDeleteChat}
														onPinToggle={handlePinToggle}
														setOpenMobile={setOpenMobile}
													/>
												))}
											</>
										)}

										{groupedChats.lastWeek.length > 0 && (
											<>
												<div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
													Last 7 days
												</div>
												{groupedChats.lastWeek.map((chat) => (
													<ChatItem
														key={chat.id}
														chat={chat}
														isActive={chat.id === id}
														onDelete={onDeleteChat}
														onPinToggle={handlePinToggle}
														setOpenMobile={setOpenMobile}
													/>
												))}
											</>
										)}

										{groupedChats.lastMonth.length > 0 && (
											<>
												<div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
													Last 30 days
												</div>
												{groupedChats.lastMonth.map((chat) => (
													<ChatItem
														key={chat.id}
														chat={chat}
														isActive={chat.id === id}
														onDelete={onDeleteChat}
														onPinToggle={handlePinToggle}
														setOpenMobile={setOpenMobile}
													/>
												))}
											</>
										)}

										{groupedChats.older.length > 0 && (
											<>
												<div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
													Older
												</div>
												{groupedChats.older.map((chat) => (
													<ChatItem
														key={chat.id}
														chat={chat}
														isActive={chat.id === id}
														onDelete={onDeleteChat}
														onPinToggle={handlePinToggle}
														setOpenMobile={setOpenMobile}
													/>
												))}
											</>
										)}
									</>
								);
							})()
						)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete your
							chat and remove it from our servers.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
