'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { convertToUIMessages, fetcher, generateUUID } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { toast } from 'sonner';

interface BaseChatProps {
  id: string;
  selectedChatModel: string;
  isReadonly?: boolean;
}

interface RegularChatProps extends BaseChatProps {
  initialMessages: Array<UIMessage>;
  selectedVisibilityType: VisibilityType;
  systemPrompt?: never;
  isPrivateMode?: never;
}

interface PrivateChatProps extends BaseChatProps {
  systemPrompt: string;
  isPrivateMode: true;
  initialMessages?: never;
  selectedVisibilityType?: never;
}

type ChatProps = RegularChatProps | PrivateChatProps;

export function Chat(props: ChatProps) {
  const { id, selectedChatModel, isReadonly = false } = props;

  const { mutate } = useSWRConfig();
  const isPrivateMode = 'isPrivateMode' in props && props.isPrivateMode;

  // Add fade-in animation state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset animation when chat ID changes
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [id]);

  // Prepare initial messages for private mode
  const initialMessages = isPrivateMode
    ? convertToUIMessages([
        {
          id,
          chatId: generateUUID(),
          role: 'system',
          createdAt: new Date(),
          parts: [{ type: 'text', text: props.systemPrompt }],
          attachments: null,
        },
      ])
    : props.initialMessages;

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    ...(isPrivateMode
      ? { api: '/api/chat/custom' }
      : {
          onFinish: () => mutate('/api/history'),
          onError: () => toast.error('An error occured, please try again!'),
        }),
  });

  const { data: votes } = useSWR<Array<Vote>>(
    !isPrivateMode && messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const selectedVisibilityType = isPrivateMode
    ? 'private'
    : props.selectedVisibilityType;
  const isSharingOptionEnabled = !isPrivateMode;

  return (
    <div
      className={`flex flex-col min-w-0 h-dvh bg-background transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <ChatHeader
        chatId={id}
        selectedVisibilityType={selectedVisibilityType}
        isReadonly={isReadonly}
        isSharingOptionEnabled={isSharingOptionEnabled}
      />

      <Messages
        chatId={id}
        status={status}
        votes={votes ?? []}
        // @ts-expect-error
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
        isPrivateMode={isPrivateMode}
      />

      <form
        className={`flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl ${messages.length === 0 ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
      >
        {!isReadonly && (
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            // @ts-expect-error
            messages={messages}
            setMessages={setMessages}
            append={append}
            selectedModelId={selectedChatModel}
          />
        )}
      </form>
    </div>
  );
}

// Keep backward compatibility alias
export const PrivateCodeChat = Chat;
