import { defineMiddleware } from 'astro:middleware';
import { getUser, requireVerifiedAuth, requireAdminAuth, requireUserOrAdminAuth, requireCustomerAuth } from './lib/auth-utils';

export const onRequest = defineMiddleware(async (context, next) => {
  // Admin routes that don't require email verification
  const unverifiedAdminRoutes = [
    '/admin/emailVerification',
    '/admin/verify-email',
    '/admin/resend-verification'
  ];

  // Admin-only routes (only admins can access)
  const adminOnlyRoutes = [
    '/admin/users',
    '/api/admin/'
  ];

  // Customer-only routes (only customers can access)
  const customerOnlyRoutes = [
    '/customer/'
  ];

  // Check if this is an admin-only route
  const isAdminOnlyRoute = adminOnlyRoutes.some(route =>
    context.url.pathname.startsWith(route)
  );

  // Check if this is a customer-only route
  const isCustomerOnlyRoute = customerOnlyRoutes.some(route =>
    context.url.pathname.startsWith(route)
  );

  if (isAdminOnlyRoute) {
    const result = await requireAdminAuth(context);
    if (result instanceof Response) {
      return result;
    }
  } else if (isCustomerOnlyRoute) {
    const result = await requireCustomerAuth(context);
    if (result instanceof Response) {
      return result;
    }
  } else {
    // Check if this is an admin route that requires verified email and user/admin role
    const isProtectedAdminRoute = context.url.pathname.startsWith('/admin') &&
      !unverifiedAdminRoutes.some(route => context.url.pathname.startsWith(route));

    if (isProtectedAdminRoute) {
      const result = await requireUserOrAdminAuth(context);
      if (result instanceof Response) {
        return result;
      }
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