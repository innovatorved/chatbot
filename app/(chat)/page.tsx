import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { generateUUID, getChatModelFromCookie } from '@/lib/utils';

export default async function Page() {
  const id = generateUUID();
  const cookieStore = await cookies();
  const selectedChatModel = await getChatModelFromCookie(cookieStore);

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      selectedChatModel={selectedChatModel}
      selectedVisibilityType="private"
      isReadonly={false}
    />
  );
}
