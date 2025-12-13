"use client";

import Form from "next/form";
import { Turnstile } from "next-turnstile";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AuthForm({
	action,
	children,
	defaultEmail = "",
	handleTurnstileStatus,
	turnstileRef,
}: {
	action: NonNullable<
		string | ((formData: FormData) => void | Promise<void>) | undefined
	>;
	children: ReactNode;
	defaultEmail?: string;
	handleTurnstileStatus: (
		status: "success" | "error" | "expired" | "required",
	) => void;
	turnstileRef: React.MutableRefObject<(() => void) | null>;
}) {
	const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
	const isDev = process.env.NODE_ENV === "development";

	const [turnstileToken, setTurnstileToken] = useState<string>("");
	const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0);

	const resetTurnstile = useMemo(
		() => () => {
			setTurnstileToken("");
			setTurnstileWidgetKey((k) => k + 1);
			handleTurnstileStatus("required");
		},
		[handleTurnstileStatus],
	);

	useEffect(() => {
		turnstileRef.current = resetTurnstile;
		return () => {
			turnstileRef.current = null;
		};
	}, [resetTurnstile, turnstileRef]);

	return (
		<Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
			<div className="flex flex-col gap-2">
				<Label
					htmlFor="email"
					className="text-zinc-600 font-normal dark:text-zinc-400"
				>
					Email Address
				</Label>

				<Input
					id="email"
					name="email"
					className="bg-muted text-md md:text-sm"
					type="email"
					placeholder="user@acme.com"
					autoComplete="email"
					required
					autoFocus
					defaultValue={defaultEmail}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label
					htmlFor="password"
					className="text-zinc-600 font-normal dark:text-zinc-400"
				>
					Password
				</Label>

				<Input
					id="password"
					name="password"
					className="bg-muted text-md md:text-sm"
					type="password"
					required
				/>
			</div>

			{siteKey ? (
				<>
					<Turnstile
						key={turnstileWidgetKey}
						siteKey={siteKey}
						retry="auto"
						refreshExpired="auto"
						responseField={false}
						sandbox={isDev}
						onError={() => {
							setTurnstileToken("");
							handleTurnstileStatus("error");
						}}
						onExpire={() => {
							setTurnstileToken("");
							handleTurnstileStatus("expired");
						}}
						onLoad={() => {
							setTurnstileToken("");
							handleTurnstileStatus("required");
						}}
						onVerify={(token) => {
							setTurnstileToken(token);
							handleTurnstileStatus("success");
						}}
					/>
					<input
						type="hidden"
						name="cf-turnstile-response"
						value={turnstileToken}
						readOnly
					/>
				</>
			) : isDev ? (
				<input
					type="hidden"
					name="cf-turnstile-response"
					value="mock-token-development"
					readOnly
				/>
			) : (
				<input type="hidden" name="cf-turnstile-response" value="" readOnly />
			)}

			{children}
		</Form>
	);
}
