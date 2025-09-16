// src/lib/auth-utils.ts
import { auth } from './auth';
import type { APIContext } from 'astro';

export async function getUser(context: APIContext) {
  try {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });
    
    return session?.user || null;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(context: APIContext) {
  const user = await getUser(context);
  
  if (!user) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }
  
  return user;
}

export async function redirectIfAuthenticated(context: APIContext, redirectTo = '/admin/dashboard') {
  const user = await getUser(context);
  
  if (user) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
      },
    });
  }
  
  return null;
}