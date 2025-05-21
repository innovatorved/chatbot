import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession, type User as NextAuthUser } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser, type User as DbUser } from '@/lib/db/queries'; // Assuming User type can be imported

import { authConfig } from './auth.config';

// Extend the default session user type to include id, and isAdmin
interface ExtendedUser extends NextAuthUser {
  id: string;
  isAdmin: boolean;
}

// Extend the default session type to use our ExtendedUser
interface ExtendedSession extends DefaultSession {
  user: ExtendedUser;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);
        if (users.length === 0) return null;
        const user = users[0];
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, user.password!);
        if (!passwordsMatch) return null;
        // Check if the user is an admin
        if (!user.isAdmin) {
          console.log(`Login attempt by non-admin user: ${user.email}`);
          return null;
        }
        return user as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // User object is the one returned from authorize
        const dbUser = user as DbUser; // Cast to DbUser which has id, email, isAdmin
        token.id = dbUser.id;
        token.email = dbUser.email;
        token.isAdmin = dbUser.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      // Ensure session and session.user exist
      if (session && session.user) {
        const extendedSession = session as ExtendedSession; // Cast to our extended session type
        extendedSession.user.id = token.id as string;
        extendedSession.user.email = token.email as string;
        extendedSession.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});
