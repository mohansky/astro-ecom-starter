import type { APIRoute } from 'astro';
import { requireAdminAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const verifyUserHandler = async (context: any) => {
  try {
    // Check if user is admin
    const authResult = await requireAdminAuth(context);
    if (authResult instanceof Response) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json();
    const { userId, emailVerified } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set emailVerified status - default to true for backward compatibility
    const verificationStatus = emailVerified !== undefined ? emailVerified : true;

    // Update user email verification status
    await db
      .update(user)
      .set({ emailVerified: verificationStatus, updatedAt: new Date() })
      .where(eq(user.id, userId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating user verification status:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = verifyUserHandler;
export const PATCH: APIRoute = verifyUserHandler;