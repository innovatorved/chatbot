import { compare } from 'bcrypt-ts';
import NextAuth, {
  type DefaultSession,
  type User as NextAuthUser,
} from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { type User as DbUser } from '@/lib/db/schema';

import { authConfig } from './auth.config';
import { getUser } from '@/lib/db/queries';

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
      async authorize({ email, password }: any, request: Request) {
        const symbols = Object.getOwnPropertySymbols(request);
        // Use 'as any' to allow symbol indexing, which is not type-safe but silences TS error
        const urlData = symbols
          .map((sym) => (request as any)[sym])
          .find((val) => val && val.url);

        const users = await getUser(email);
        if (users.length === 0) return null;
        const user = users[0];
        // biome-ignore lint: Forbidden non-null assertion.
        const passwordsMatch = await compare(password, user.password!);
        if (!passwordsMatch) return null;
        // Check if the user is an admin
        if (!user.isAdmin) {
          console.log(`Login attempt by non-admin user: ${user.email}`);
          return user;
        }
        return user as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
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
        const extendedSession = session;
        extendedSession.user.id = token.id as string;
        extendedSession.user.email = token.email as string;
        extendedSession.user.isAdmin = token.isAdmin as boolean;
        return extendedSession;
      }
      return session;
    },
  },
});
