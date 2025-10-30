'use server';

import { generateText, type Message } from 'ai';
import { cookies } from 'next/headers';

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  deleteAllChatsByUserId,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: Message;
}) {
  try {
    // Extract the text content from the message
    let messageText = '';

    if (typeof message === 'string') {
      messageText = message;
    } else if (message && typeof message === 'object') {
      // Handle different message formats
      if ('text' in message && typeof message.text === 'string') {
        messageText = message.text;
      } else if ('content' in message && typeof message.content === 'string') {
        messageText = message.content;
      } else if ('parts' in message && Array.isArray(message.parts)) {
        messageText = message.parts
          .map((part: any) =>
            typeof part === 'string' ? part : part.text || '',
          )
          .join(' ');
      } else {
        // Fallback: convert to string
        messageText = JSON.stringify(message);
      }
    }

    const { text: title } = await generateText({
      model: myProvider.languageModel('title-model'),
      system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
      prompt: messageText,
    });

    return title;
  } catch (error) {
    console.error('Error generating title:', error);
    // Return a default title if generation fails
    return 'New Chat';
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export async function clearChatHistory({ userId }: { userId: string }) {
  await deleteAllChatsByUserId({ userId });
}
