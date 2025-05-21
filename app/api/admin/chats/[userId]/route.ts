import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getChatsAndMessagesByUserId } from '@/lib/db/queries';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    // session.user.isAdmin should be available from previous auth setup
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Invalid userId parameter' }, { status: 400 });
    }

    // User is an admin, fetch chats and messages for the given userId
    const chatsAndMessages = await getChatsAndMessagesByUserId(userId);

    // It's valid for a user to have no chats, so an empty array is a success case.
    // A 404 might be misleading if the user exists but has no chats.
    // The client can interpret an empty array as "no chats found".

    return NextResponse.json(chatsAndMessages, { status: 200 });
  } catch (error) {
    // Log the error with more context if possible
    const userIdForError = params ? params.userId : 'unknown';
    console.error(`Failed to fetch chats and messages for userId ${userIdForError}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
