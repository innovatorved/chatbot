import { z } from "zod";

/** Limits request size abuse; messages are validated as unknown then cast for the AI SDK. */
export const chatPostBodySchema = z.object({
	id: z.string().min(1).max(128),
	messages: z.array(z.unknown()).max(500),
	selectedChatModel: z.string().min(1).max(128),
});

export type ChatPostBody = z.infer<typeof chatPostBodySchema>;
