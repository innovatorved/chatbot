import { useCallback, useEffect, useRef } from "react";

export function useAutoResizeTextarea<T extends HTMLTextAreaElement>() {
	const textareaRef = useRef<T>(null);

	const adjustHeight = useCallback(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
		}
	}, []);

	const resetHeight = (defaultHeight = "98px") => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = defaultHeight;
		}
	};

	useEffect(() => {
		adjustHeight();
	}, [adjustHeight]);

	return { textareaRef, adjustHeight, resetHeight };
}
