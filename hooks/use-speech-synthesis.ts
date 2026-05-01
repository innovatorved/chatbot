"use client";

import { useCallback, useEffect, useState } from "react";

export function useSpeechSynthesis() {
	const [isSupported, setIsSupported] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);

	useEffect(() => {
		setIsSupported(
			typeof window !== "undefined" &&
				typeof window.speechSynthesis !== "undefined",
		);
	}, []);

	useEffect(() => {
		return () => {
			if (typeof window !== "undefined" && window.speechSynthesis) {
				window.speechSynthesis.cancel();
			}
		};
	}, []);

	const speak = useCallback((text: string) => {
		if (typeof window === "undefined" || !window.speechSynthesis) return;
		const trimmed = text.trim();
		if (trimmed.length === 0) return;

		window.speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(trimmed);
		utterance.onstart = () => setIsSpeaking(true);
		utterance.onend = () => setIsSpeaking(false);
		utterance.onerror = () => setIsSpeaking(false);

		window.speechSynthesis.speak(utterance);
	}, []);

	const cancel = useCallback(() => {
		if (typeof window === "undefined" || !window.speechSynthesis) return;
		window.speechSynthesis.cancel();
		setIsSpeaking(false);
	}, []);

	return { isSupported, isSpeaking, speak, cancel };
}

export function stripMarkdown(text: string): string {
	return text
		.replace(/```[\s\S]*?```/g, " code block ")
		.replace(/`([^`]*)`/g, "$1")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[*_~#>]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}
