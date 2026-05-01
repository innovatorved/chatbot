import { z } from "zod";

import { auth } from "@/app/(auth)/auth";
import { getUserById, updateUserInstructions } from "@/lib/db/queries";

const MAX_INSTRUCTIONS_LENGTH = 2000;

const putBodySchema = z.object({
	customInstructions: z
		.string()
		.max(MAX_INSTRUCTIONS_LENGTH, "Instructions are too long")
		.transform((value) => value.trim()),
});

export async function GET() {
	const session = await auth();

	if (!session || !session.user || !session.user.id) {
		return new Response("Unauthorized", { status: 401 });
	}

	try {
		const dbUser = await getUserById(session.user.id);

		return Response.json(
			{ customInstructions: dbUser?.customInstructions ?? "" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("GET /api/user/instructions error:", error);
		return new Response("Failed to load instructions", { status: 500 });
	}
}

export async function PUT(request: Request) {
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

	const parsed = putBodySchema.safeParse(json);
	if (!parsed.success) {
		return new Response("Invalid request body", { status: 400 });
	}

	const value = parsed.data.customInstructions;

	try {
		await updateUserInstructions({
			id: session.user.id,
			customInstructions: value.length === 0 ? null : value,
		});
		return Response.json({ customInstructions: value }, { status: 200 });
	} catch (error) {
		console.error("PUT /api/user/instructions error:", error);
		return new Response("Failed to save instructions", { status: 500 });
	}
}
