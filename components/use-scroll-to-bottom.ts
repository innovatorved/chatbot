import { useEffect, useRef, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T | null>,
  RefObject<T | null>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      const observer = new MutationObserver((mutations) => {
        // Only scroll if new message elements are added at the container level
        // Ignore deep subtree changes (like tooltips, buttons appearing on hover)
        const hasNewMessage = mutations.some((mutation) => {
          // Only check direct children of the container
          if (mutation.target === container && mutation.type === 'childList') {
            // Check if added nodes are message elements (not the end marker)
            return Array.from(mutation.addedNodes).some(
              (node) =>
                node instanceof HTMLElement && node.hasAttribute('data-role'),
            );
          }
          return false;
        });

        if (hasNewMessage) {
          end.scrollIntoView({ behavior: 'instant', block: 'end' });
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return [containerRef, endRef];
}
