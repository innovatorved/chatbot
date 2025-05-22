import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/';
      const isOnChat =
        nextUrl.pathname.startsWith('/chat') ||
        nextUrl.pathname.match(/^\/[a-zA-Z0-9_-]{20,}/); // Matches root paths that look like chat IDs
      const isOnPublicApi =
        nextUrl.pathname.startsWith('/api/chat') ||
        nextUrl.pathname.startsWith('/api/files'); // Or other public API paths

      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      const isOnAdminArea = nextUrl.pathname.startsWith('/admin');
      const isOnAdminLogin = nextUrl.pathname.startsWith('/admin/login');
      const isOnAdminApi = nextUrl.pathname.startsWith('/api/admin');

      // Handle Admin Area access
      if (isOnAdminArea || isOnAdminApi) {
        if (isOnAdminLogin) {
          if (isLoggedIn && auth?.user?.isAdmin) {
            // If admin is logged in and tries to access admin login, redirect to dashboard
            return Response.redirect(
              new URL('/admin/dashboard/users', nextUrl as unknown as URL),
            );
          }
          return true; // Allow access to admin login page for everyone else
        }

        // For any other /admin path or /api/admin path
        if (!isLoggedIn) {
          return Response.redirect(
            new URL('/admin/login', nextUrl as unknown as URL),
          );
        }
        if (!auth?.user?.isAdmin) {
          // If logged in but not an admin, redirect to main app page or show an error
          return Response.redirect(new URL('/', nextUrl as unknown as URL)); // Or a specific "access denied" page
        }
        return true; // Admin is logged in, allow access
      }

      // Handle general public/user routes
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        // If logged in, redirect from /login or /register to root
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      if (isOnLogin || isOnRegister) {
        return true; // Allow access to login/register pages if not logged in
      }

      // For chat routes (root, /chat/:id, or dynamic ID-like paths)
      // and public APIs, require login
      if (isOnRoot || isOnChat || isOnPublicApi) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page for these routes
      }

      // If a logged-in user tries to access any other path not covered,
      // redirect them to the root. This can be adjusted if there are other public pages.
      if (isLoggedIn) {
        // This case might be too broad. Consider if there are other authenticated user paths
        // that are not admin and not chat. For now, this is a catch-all.
        // If trying to access a non-existent page while logged in, redirect to root.
        // Or, if it's a path that should be public but isn't matched above.
        // This rule might need refinement based on exact site structure.
        // For now, assume most other paths are not meant for direct access or are covered by other rules.
      }

      // Default to allowing access for any routes not specifically handled yet
      // This could be for truly public static assets or pages not needing auth.
      // However, given the matcher, most routes are intended to be covered.
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.isAdmin = token.isAdmin as boolean;
        console.log({ session });
      }
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
  },
} satisfies NextAuthConfig;
