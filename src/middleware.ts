import { defineMiddleware } from 'astro:middleware';
import { getUser } from './lib/auth-utils';

export const onRequest = defineMiddleware(async (context, next) => {
  // Protected admin routes that require authentication
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route =>
    context.url.pathname.startsWith(route)
  );

  if (isAdminRoute) {
    const user = await getUser(context);
   
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/login',
        },
      });
    }
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.includes(context.url.pathname);
 
  if (isAuthRoute) {
    const user = await getUser(context);
   
    if (user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/admin',
        },
      });
    }
  }

  return next();
});