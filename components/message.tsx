'use client';

import type { UIMessage } from 'ai';
import { memo } from 'react';
import { Markdown } from './markdown';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';

// Simplified props
const PurePreviewMessage = ({ message }: { message: UIMessage }) => {
  const isAssistant = message.role === 'assistant';
  const avatarUrl = isAssistant
    ? 'https://lh3.googleusercontent.com/a/ACg8ocJ_39364myR9nQ0G3_8c3D9Q_L9gBYgO7uQ0gS_EnQ=s96-c'
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80';

  // Filter out non-text parts, as other types are not handled by the new design.
  const textParts = message.parts?.filter((part) => part.type === 'text');

  if (!textParts || textParts.length === 0) {
    return null; // Or some placeholder if a message must be rendered
  }

  return (
    <div
      data-testid={`message-${message.role}`}
      className={cn(
        'flex gap-3 p-4 w-full',
        isAssistant ? 'justify-start' : 'justify-end',
      )}
    >
      {isAssistant && (
        <div
          className="w-8 h-8 rounded-full bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        ></div>
      )}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[70%]',
          isAssistant ? 'items-start' : 'items-end',
        )}
      >
        {isAssistant && (
          <span className="text-xs text-gray-600">ChatBot</span>
        )}
        {textParts.map((part, index) => (
          <div
            key={`message-${message.id}-part-${index}`}
            data-testid="message-content"
            className={cn(
              'p-3 rounded-lg text-[#101518]',
              isAssistant ? 'bg-[#eaedf1]' : 'bg-[#dce8f3]',
            )}
          >
            {/* Assuming part.type is 'text' due to filtering */}
            <Markdown>{part.text}</Markdown>
          </div>
        ))}
      </div>
      {!isAssistant && (
        <div
          className="w-8 h-8 rounded-full bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${avatarUrl})` }}
        ></div>
      )}
    </div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    // Simplified comparison based on visible content
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.message.role !== nextProps.message.role) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    return true;
  },
);

export const ThinkingMessage = () => {
  const avatarUrl =
    'https://lh3.googleusercontent.com/a/ACg8ocJ_39364myR9nQ0G3_8c3D9Q_L9gBYgO7uQ0gS_EnQ=s96-c';

  return (
    <div
      data-testid="message-assistant-loading"
      className="flex gap-3 p-4 w-full justify-start"
    >
      <div
        className="w-8 h-8 rounded-full bg-cover bg-center shrink-0"
        style={{ backgroundImage: `url(${avatarUrl})` }}
      ></div>
      <div className="flex flex-col gap-1 items-start max-w-[70%]">
        <span className="text-xs text-gray-600">ChatBot</span>
        <div className="p-3 rounded-lg bg-[#eaedf1] text-[#101518]">
          Hmm...
        </div>
      </div>
    </div>
  );
};
