'use client';

import type { Message } from 'ai';
import { Button } from './ui/button';
import { type Dispatch, type SetStateAction, useState } from 'react';
import { Textarea } from './ui/textarea';
import { deleteTrailingMessages } from '@/app/(chat)/actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';

export type MessageEditorProps = {
  message: Message;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isPrivateMode?: boolean;
};

export function MessageEditor({
  message,
  setMode,
  setMessages,
  reload,
  isPrivateMode = false,
}: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract text content from message parts
  const getMessageText = (msg: Message): string => {
    if (msg.content) return msg.content;

    return (
      msg.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('\n')
        .trim() || ''
    );
  };

  const [draftContent, setDraftContent] = useState(getMessageText(message));
  const { textareaRef, adjustHeight } =
    useAutoResizeTextarea<HTMLTextAreaElement>();

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Only delete trailing messages from database if not in private mode
    if (!isPrivateMode) {
      await deleteTrailingMessages({ id: message.id });
    }

    // @ts-expect-error todo: support UIMessage in setMessages
    setMessages((messages) => {
      const index = messages.findIndex((m) => m.id === message.id);

      if (index !== -1) {
        const updatedMessage = {
          ...message,
          content: draftContent,
          parts: [{ type: 'text', text: draftContent }],
        };

        return [...messages.slice(0, index), updatedMessage];
      }

      return messages;
    });

    setMode('view');
    reload();
  };

  return (
    <div className="flex flex-col gap-2 w-full min-w-[600px] max-w-full">
      <Textarea
        data-testid="message-editor"
        ref={textareaRef}
        className="bg-transparent outline-hidden overflow-hidden resize-none text-base! rounded-xl w-full min-h-[100px]"
        value={draftContent}
        onChange={handleInput}
      />

      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          onClick={() => setMode('view')}
        >
          Cancel
        </Button>
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
