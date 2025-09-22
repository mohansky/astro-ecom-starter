import type { APIRoute } from 'astro';
import { requireUserOrAdminAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { user } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
  try {
    // Check authentication - users can update their own avatars, admins can update any user's avatar
    const currentUser = await requireUserOrAdminAuth(context);
    if (currentUser instanceof Response) {
      return currentUser;
    }

    const { userId, avatarPath } = await context.request.json();

    if (!avatarPath) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing avatarPath'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If no userId provided, use current user's ID (for self-update)
    const targetUserId = userId || currentUser.id;

    // Check if user is trying to update someone else's avatar (only admins allowed)
    if (userId && userId !== currentUser.id && currentUser.role !== 'admin') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized to update avatar for other users'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user's image field in the database
    await db
      .update(user)
      .set({
        image: avatarPath,
        updatedAt: new Date()
      })
      .where(eq(user.id, targetUserId));

    console.log(`Updated avatar for user ${targetUserId}: ${avatarPath}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'User avatar updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error updating user avatar:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to update user avatar: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};