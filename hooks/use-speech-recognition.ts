"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionResult = {
	transcript: string;
	isFinal: boolean;
};

type RecognitionLike = {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	abort: () => void;
	onresult:
		| ((event: {
				results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
		  }) => void)
		| null;
	onend: (() => void) | null;
	onerror: ((event: { error?: string }) => void) | null;
};

declare global {
	interface Window {
		SpeechRecognition?: { new (): RecognitionLike };
		webkitSpeechRecognition?: { new (): RecognitionLike };
	}
}

function getRecognitionCtor(): { new (): RecognitionLike } | null {
	if (typeof window === "undefined") return null;
	return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition({
	onTranscript,
}: {
	onTranscript: (text: string) => void;
}) {
	const [isSupported, setIsSupported] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const recognitionRef = useRef<RecognitionLike | null>(null);

	useEffect(() => {
		setIsSupported(getRecognitionCtor() !== null);
		return () => {
			recognitionRef.current?.abort();
			recognitionRef.current = null;
		};
	}, []);

	const start = useCallback(() => {
		const Ctor = getRecognitionCtor();
		if (!Ctor) return;

		try {
			const recognition = new Ctor();
			recognition.continuous = false;
			recognition.interimResults = false;
			recognition.lang =
				typeof navigator !== "undefined" ? navigator.language : "en-US";

			recognition.onresult = (event) => {
				let final = "";
				for (let i = 0; i < event.results.length; i += 1) {
					const result = event.results[i][0];
					if (result?.transcript) {
						final += result.transcript;
					}
				}
				if (final.trim().length > 0) {
					onTranscript(final.trim());
				}
			};
			recognition.onerror = () => {
				setIsListening(false);
			};
			recognition.onend = () => {
				setIsListening(false);
				recognitionRef.current = null;
			};

			recognitionRef.current = recognition;
			recognition.start();
			setIsListening(true);
		} catch (error) {
			console.error("Speech recognition failed to start:", error);
			setIsListening(false);
		}
	}, [onTranscript]);

	const stop = useCallback(() => {
		recognitionRef.current?.stop();
		setIsListening(false);
	}, []);

	const toggle = useCallback(() => {
		if (isListening) {
			stop();
		} else {
			start();
		}
	}, [isListening, start, stop]);

	return { isSupported, isListening, start, stop, toggle };
}
