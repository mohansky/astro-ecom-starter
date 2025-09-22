// src/lib/auth-utils.ts
import { auth, type User } from './auth';
import { rawDb } from './db';
import type { APIContext } from 'astro';

// Function to generate username from name (same as in auth.ts)
async function generateUsername(name: string): Promise<string> {
  const baseUsername = name
    .replace(/\s+/g, '')
    .toLowerCase()
    .slice(0, 5)
    .replace(/[^a-z0-9]/g, '');

  const paddedUsername = baseUsername.length < 3 ? baseUsername + 'user' : baseUsername;

  let username = paddedUsername;
  let counter = 1;

  while (true) {
    try {
      const existingUser = await rawDb.execute({
        sql: 'SELECT id FROM user WHERE username = ?',
        args: [username]
      });

      if (existingUser.rows.length === 0) {
        return username;
      }

      username = paddedUsername + counter;
      counter++;
    } catch (error) {
      console.error('Error checking username uniqueness:', error);
      username = paddedUsername + Math.floor(Math.random() * 10000);
      return username;
    }
  }
}

// Helper function to ensure user has username
async function ensureUserHasUsername(user: User): Promise<User> {
  if (!user.username) {
    try {
      const generatedUsername = await generateUsername(user.name);

      await rawDb.execute({
        sql: 'UPDATE user SET username = ? WHERE id = ?',
        args: [generatedUsername, user.id]
      });

      console.log(`Auto-generated username "${generatedUsername}" for user ${user.name}`);

      // Return user with updated username
      return { ...user, username: generatedUsername };
    } catch (error) {
      console.error('Error auto-generating username:', error);
      return user;
    }
  }
  return user;
}

export async function getUser(context: APIContext): Promise<User | null> {
  try {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });

    if (session?.user) {
      const user = session.user as User;
      // Automatically generate username if user doesn't have one
      return await ensureUserHasUsername(user);
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function requireAuth(context: APIContext): Promise<User | Response> {
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

export async function getVerifiedUser(context: APIContext): Promise<User | null> {
  const user = await getUser(context);

  // Return user only if they exist and email is verified
  if (user && user.emailVerified) {
    return user;
  }

  return null;
}

export async function requireVerifiedAuth(context: APIContext): Promise<User | Response> {
  const user = await getVerifiedUser(context);

  if (!user) {
    const unverifiedUser = await getUser(context);

    // If user exists but not verified, redirect to email verification
    if (unverifiedUser && !unverifiedUser.emailVerified) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/admin/emailVerification',
        },
      });
    }

    // If no user at all, redirect to login
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }

  return user;
}

export async function requireAdminAuth(context: APIContext): Promise<User | Response> {
  const user = await getVerifiedUser(context);

  if (!user) {
    const unverifiedUser = await getUser(context);

    // If user exists but not verified, redirect to email verification
    if (unverifiedUser && !unverifiedUser.emailVerified) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/admin/emailVerification',
        },
      });
    }

    // If no user at all, redirect to login
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }

  // Check if user has admin role
  if (user.role !== 'admin') {
    return new Response(null, {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  return user;
}

export async function requireUserOrAdminAuth(context: APIContext): Promise<User | Response> {
  const user = await getVerifiedUser(context);

  if (!user) {
    const unverifiedUser = await getUser(context);

    // If user exists but not verified, redirect to email verification
    if (unverifiedUser && !unverifiedUser.emailVerified) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/admin/emailVerification',
        },
      });
    }

    // If no user at all, redirect to login
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }

  // Check if user has admin or user role (not customer)
  if (user.role === 'customer') {
    return new Response(null, {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  return user;
}

export async function requireCustomerAuth(context: APIContext): Promise<User | Response> {
  const user = await getVerifiedUser(context);

  if (!user) {
    const unverifiedUser = await getUser(context);

    // If user exists but not verified, redirect to email verification
    if (unverifiedUser && !unverifiedUser.emailVerified) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/admin/emailVerification',
        },
      });
    }

    // If no user at all, redirect to login
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login',
      },
    });
  }

  // Check if user has customer role
  if (user.role !== 'customer') {
    return new Response(null, {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  return user;
}

export async function redirectIfAuthenticated(context: APIContext, redirectTo = '/admin') {
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