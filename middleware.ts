import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // Apply middleware to:
  // - Root and specific ID routes for chat (e.g., '/', '/chat/123')
  // - All API routes
  // - Login and register pages
  // - All admin pages
  matcher: [
    '/',
    '/:id',
    '/api/:path*',
    '/login',
    '/register',
    '/admin/:path*',
  ],
};
