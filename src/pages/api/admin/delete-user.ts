import type { APIRoute } from 'astro';
import { requireAdminAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { user, session, account } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const deleteUserHandler = async (context: any) => {
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
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if trying to delete own account
    if (authResult.id === userId) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete related data first (sessions and accounts)
    await db.delete(session).where(eq(session.userId, userId));
    await db.delete(account).where(eq(account.userId, userId));

    // Delete user
    await db.delete(user).where(eq(user.id, userId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = deleteUserHandler;
export const POST: APIRoute = deleteUserHandler;