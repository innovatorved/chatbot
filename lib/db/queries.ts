import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";

import { getDb } from "./index";
import { chat, type DBMessage, message, type User, user, vote } from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

const withErrorHandling = async <T>(
	operation: () => Promise<T>,
	errorMessage: string,
): Promise<T> => {
	try {
		return await operation();
	} catch (error) {
		console.error(errorMessage, error);
		throw error;
	}
};

export async function getUser(email: string): Promise<Array<User>> {
	return withErrorHandling(
		() => getDb().select().from(user).where(eq(user.email, email)),
		"Failed to get user from database",
	);
}

export async function createUser(email: string, password: string) {
	const salt = genSaltSync(10);
	const hash = hashSync(password, salt);

	return withErrorHandling(
		() => getDb().insert(user).values({ email, password: hash }),
		"Failed to create user in database",
	);
}

export async function saveChat({
	id,
	userId,
	title,
}: {
	id: string;
	userId: string;
	title: string;
}) {
	return withErrorHandling(
		() =>
			getDb().insert(chat).values({
				id,
				createdAt: new Date(),
				userId,
				title,
			}),
		"Failed to save chat in database",
	);
}

export async function deleteChatById({ id }: { id: string }) {
	return withErrorHandling(async () => {
		await getDb().delete(vote).where(eq(vote.chatId, id));
		await getDb().delete(message).where(eq(message.chatId, id));
		return await getDb().delete(chat).where(eq(chat.id, id));
	}, "Failed to delete chat by id from database");
}

export async function getChatsByUserId({ id }: { id: string }) {
	return withErrorHandling(
		() =>
			getDb()
				.select()
				.from(chat)
				.where(eq(chat.userId, id))
				.orderBy(desc(chat.createdAt)),
		"Failed to get chats by user from database",
	);
}

export async function getChatById({ id }: { id: string }) {
	return withErrorHandling(async () => {
		const [selectedChat] = await getDb().select().from(chat).where(eq(chat.id, id));
		return selectedChat;
	}, "Failed to get chat by id from database");
}

export async function saveMessages({
	messages,
}: {
	messages: Array<DBMessage>;
}) {
	return withErrorHandling(
		() => getDb().insert(message).values(messages),
		"Failed to save messages in database",
	);
}

export async function getMessagesByChatId({ id }: { id: string }) {
	return withErrorHandling(
		() =>
			getDb()
				.select()
				.from(message)
				.where(eq(message.chatId, id))
				.orderBy(asc(message.createdAt)),
		"Failed to get messages by chat id from database",
	);
}

export async function voteMessage({
	chatId,
	messageId,
	type,
}: {
	chatId: string;
	messageId: string;
	type: "up" | "down";
}) {
	return withErrorHandling(async () => {
		const [existingVote] = await getDb()
			.select()
			.from(vote)
			.where(and(eq(vote.messageId, messageId)));

		if (existingVote) {
			return await getDb()
				.update(vote)
				.set({ isUpvoted: type === "up" })
				.where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
		}
		return await getDb().insert(vote).values({
			chatId,
			messageId,
			isUpvoted: type === "up",
		});
	}, "Failed to upvote message in database");
}

export async function getVotesByChatId({ id }: { id: string }) {
	return withErrorHandling(
		() => getDb().select().from(vote).where(eq(vote.chatId, id)),
		"Failed to get votes by chat id from database",
	);
}

export async function getMessageById({ id }: { id: string }) {
	return withErrorHandling(
		() => getDb().select().from(message).where(eq(message.id, id)),
		"Failed to get message by id from database",
	);
}

export async function deleteMessagesByChatIdAfterTimestamp({
	chatId,
	timestamp,
}: {
	chatId: string;
	timestamp: Date;
}) {
	return withErrorHandling(async () => {
		const messagesToDelete = await getDb()
			.select({ id: message.id })
			.from(message)
			.where(
				and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
			);

		const messageIds = messagesToDelete.map((message) => message.id);

		if (messageIds.length > 0) {
			await getDb()
				.delete(vote)
				.where(
					and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
				);

			return await getDb()
				.delete(message)
				.where(
					and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
				);
		}
	}, "Failed to delete messages by id after timestamp from database");
}

export async function updateChatVisiblityById({
	chatId,
	visibility,
}: {
	chatId: string;
	visibility: "private" | "public";
}) {
	return withErrorHandling(
		() => getDb().update(chat).set({ visibility }).where(eq(chat.id, chatId)),
		"Failed to update chat visibility in database",
	);
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
	return withErrorHandling(async () => {
		const userChats = await getDb()
			.select({ id: chat.id })
			.from(chat)
			.where(eq(chat.userId, userId));

		const chatIds = userChats.map((chat) => chat.id);

		if (chatIds.length > 0) {
			await getDb().delete(vote).where(inArray(vote.chatId, chatIds));
			await getDb().delete(message).where(inArray(message.chatId, chatIds));
			return await getDb().delete(chat).where(eq(chat.userId, userId));
		}
	}, "Failed to delete all chats by user id from database");
}
