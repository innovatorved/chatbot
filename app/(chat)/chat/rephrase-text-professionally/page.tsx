import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import type { Metadata } from 'next';
import { getChatModelFromCookie } from '@/lib/utils';

export const metadata: Metadata = {
  metadataBase: new URL(
    'https://chatbot-in.vercel.app/rephrase-text-professionally',
  ),
  title: 'Rephrase Text Professionally',
};

const chatId = 'rephrase-text-professionally';

const SYSTEM_PROMPT = `
You are an expert communication assistant. For every text:
Rephrase the text, correct the grammatic errors to make it more professional.
`;

export default async function PrivateCodeChatPage() {
  const cookieStore = await cookies();
  const selectedChatModel = await getChatModelFromCookie(cookieStore);

  return (
    <Chat
      id={chatId}
      selectedChatModel={selectedChatModel}
      systemPrompt={SYSTEM_PROMPT}
      isPrivateMode
    />
  );
}
