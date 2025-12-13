"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	useActionState,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";

import { type LoginActionState, login } from "../actions";

export default function Page() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [isSuccessful, setIsSuccessful] = useState(false);
	const [turnstileStatus, setTurnstileStatus] = useState<
		"success" | "error" | "expired" | "required"
	>("required");
	const turnstileRef = useRef<(() => void) | null>(null);

	const handleTurnstileStatus = useCallback(
		(status: "success" | "error" | "expired" | "required") => {
			setTurnstileStatus(status);
		},
		[],
	);

	const [state, formAction] = useActionState<LoginActionState, FormData>(
		login,
		{
			status: "idle",
		},
	);

	useEffect(() => {
		if (state.status === "failed") {
			// Use setTimeout to avoid state update during render
			setTimeout(() => handleTurnstileStatus("required"), 0);
			turnstileRef.current?.();
			toast({
				type: "error",
				description: "Invalid credentials!",
			});
		} else if (state.status === "invalid_data") {
			setTimeout(() => handleTurnstileStatus("required"), 0);
			turnstileRef.current?.();
			toast({
				type: "error",
				description: "Failed validating your submission!",
			});
		} else if (state.status === "invalid_captcha") {
			setTimeout(() => handleTurnstileStatus("required"), 0);
			turnstileRef.current?.();
			toast({
				type: "error",
				description: "Failed validating the CAPTCHA!",
			});
		} else if (state.status === "success") {
			setTimeout(() => setIsSuccessful(true), 0);
			turnstileRef.current?.();
			router.refresh();
		}
	}, [state.status, handleTurnstileStatus, router]);

	// Auto-complete Turnstile in development mode
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			// We use a timeout to avoid setting state during render or immediately after
			// which can cause issues with React's strict mode or concurrent features.
			// Also ensures it happens after mount.
			const timer = setTimeout(() => {
				handleTurnstileStatus("success");
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [handleTurnstileStatus]);

	const handleSubmit = (formData: FormData) => {
		setEmail(formData.get("email") as string);
		switch (turnstileStatus) {
			case "required":
				turnstileRef.current?.();
				toast({
					type: "error",
					description: "Please complete the CAPTCHA challenge",
				});
				break;
			case "expired":
				turnstileRef.current?.();
				toast({
					type: "error",
					description: "Please complete the CAPTCHA challenge",
				});
				break;
			case "error":
				turnstileRef.current?.();
				toast({
					type: "error",
					description: "Please complete the CAPTCHA challenge",
				});
				break;
			case "success":
				formAction(formData);
				break;
		}
	};

	return (
		<div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
			<div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
				<div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
					<h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
					<p className="text-sm text-gray-500 dark:text-zinc-400">
						Use your email and password to sign in
					</p>
				</div>
				<AuthForm
					action={handleSubmit}
					defaultEmail={email}
					handleTurnstileStatus={handleTurnstileStatus}
					turnstileRef={turnstileRef}
				>
					<SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
					<p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
						{"Don't have an account? "}
						<Link
							href="/register"
							className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
						>
							Sign up
						</Link>
						{" for free."}
					</p>
				</AuthForm>
			</div>
		</div>
	);
}
