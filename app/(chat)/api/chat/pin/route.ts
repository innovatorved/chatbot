import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { getChatById, setChatPinned } from "@/lib/db/queries";

const patchBodySchema = z.object({
	chatId: z.string().uuid(),
	isPinned: z.boolean(),
});

export async function PATCH(request: Request) {
	const session = await auth();

	if (!session || !session.user || !session.user.id) {
		return new Response("Unauthorized", { status: 401 });
	}

	let json: unknown;
	try {
		json = await request.json();
	} catch {
		return new Response("Invalid JSON body", { status: 400 });
	}

	const parsed = patchBodySchema.safeParse(json);
	if (!parsed.success) {
		return new Response("Invalid request body", { status: 400 });
	}

	const { chatId, isPinned } = parsed.data;

	const chat = await getChatById({ id: chatId });
	if (!chat) {
		return new Response("Chat not found", { status: 404 });
	}

	if (chat.userId !== session.user.id) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		await setChatPinned({ chatId, userId: session.user.id, isPinned });
		return Response.json({ chatId, isPinned }, { status: 200 });
	} catch (error) {
		console.error("PATCH /api/chat/pin error:", error);
		return new Response("Failed to update pin state", { status: 500 });
	}
}
