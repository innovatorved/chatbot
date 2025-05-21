import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth'; // Adjusted path if necessary
import { getAllUsers } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Check if user is authenticated and is an admin
    // The session type was updated in app/(auth)/auth.ts to include isAdmin
    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // User is an admin, fetch all users
    const users = await getAllUsers();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
