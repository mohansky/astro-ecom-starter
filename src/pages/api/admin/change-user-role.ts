import type { APIRoute } from 'astro';
import { requireAdminAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const PATCH: APIRoute = async (context) => {
  try {
    // Check if user is admin
    const authResult = await requireAdminAuth(context);
    if (authResult instanceof Response) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { userId, newRole } = await context.request.json();

    // Validate input
    if (!userId || !newRole) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID and new role are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate role
    if (!['admin', 'user', 'customer'].includes(newRole)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid role. Must be admin, user, or customer'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user exists
    const existingUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);

    if (existingUser.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prevent changing own role
    if (userId === authResult.id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You cannot change your own role'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user role
    await db.update(user)
      .set({
        role: newRole,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId));

    return new Response(JSON.stringify({
      success: true,
      message: `User role updated to ${newRole} successfully`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error changing user role:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};