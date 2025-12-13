"use server";

import { validateTurnstileToken } from "next-turnstile";
import { v4 as generateRandomUUID } from "uuid";
import { z } from "zod";
import { createUser, getUser } from "@/lib/db/queries";
import { signIn } from "./auth";

const authFormSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});
export interface LoginActionState {
	status:
		| "idle"
		| "in_progress"
		| "success"
		| "failed"
		| "invalid_data"
		| "invalid_captcha";
}

export const login = async (
	_: LoginActionState,
	formData: FormData,
): Promise<LoginActionState> => {
	try {
		if (process.env.NODE_ENV === "production") {
			const tokenRaw = formData.get("cf-turnstile-response");
			const token = typeof tokenRaw === "string" ? tokenRaw : "";
			const secretKey = process.env.TURNSTILE_SECRET_KEY;

			if (!secretKey) {
				console.error("Turnstile secret key is missing");
				return { status: "failed" };
			}

			if (!token) {
				return { status: "invalid_captcha" };
			}

			try {
				const validationResponse = await validateTurnstileToken({
					token,
					secretKey,
					idempotencyKey: generateRandomUUID(),
				});

				if (!validationResponse.success) {
					return { status: "invalid_captcha" };
				}
			} catch (error) {
				console.error("Turnstile validation failed", error);
				return { status: "invalid_captcha" };
			}
		}

		const validatedData = authFormSchema.parse({
			email: formData.get("email"),
			password: formData.get("password"),
		});

		await signIn("credentials", {
			email: validatedData.email,
			password: validatedData.password,
			redirect: false,
		});

		return { status: "success" };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { status: "invalid_data" };
		}

		return { status: "failed" };
	}
};

export interface RegisterActionState {
	status:
		| "idle"
		| "in_progress"
		| "success"
		| "failed"
		| "user_exists"
		| "invalid_data"
		| "invalid_captcha";
}

export const register = async (
	_: RegisterActionState,
	formData: FormData,
): Promise<RegisterActionState> => {
	try {
		if (process.env.NODE_ENV === "production") {
			const tokenRaw = formData.get("cf-turnstile-response");
			const token = typeof tokenRaw === "string" ? tokenRaw : "";
			const secretKey = process.env.TURNSTILE_SECRET_KEY;

			if (!secretKey) {
				console.error("Turnstile secret key is missing");
				return { status: "failed" };
			}

			if (!token) {
				return { status: "invalid_captcha" };
			}

			try {
				const validationResponse = await validateTurnstileToken({
					token,
					secretKey,
					idempotencyKey: generateRandomUUID(),
				});

				if (!validationResponse.success) {
					return { status: "invalid_captcha" };
				}
			} catch (error) {
				console.error("Turnstile validation failed", error);
				return { status: "invalid_captcha" };
			}
		}

		const validatedData = authFormSchema.parse({
			email: formData.get("email"),
			password: formData.get("password"),
		});

		const [user] = await getUser(validatedData.email);

		if (user) {
			return { status: "user_exists" } as RegisterActionState;
		}
		await createUser(validatedData.email, validatedData.password);
		await signIn("credentials", {
			email: validatedData.email,
			password: validatedData.password,
			redirect: false,
		});

		return { status: "success" };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { status: "invalid_data" };
		}

		return { status: "failed" };
	}
};
