// src/pages/api/users/[id].ts
import { rawDb } from '../../../lib/db';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  try {
    const userId = params.id;

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Invalid user ID',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user from database
    const userResult = await rawDb.execute({
      sql: 'SELECT * FROM user WHERE id = ?',
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = userResult.rows[0];

    return new Response(JSON.stringify({
      success: true,
      users: [{
        id: String(user.id),
        name: String(user.name),
        username: user.username ? String(user.username) : null,
        email: String(user.email),
        role: String(user.role),
        emailVerified: Boolean(user.emailVerified),
        image: user.image ? String(user.image) : null,
        lastLoginAt: user.lastLoginAt ? String(user.lastLoginAt) : null,
        createdAt: String(user.createdAt),
        updatedAt: String(user.updatedAt),
      }]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get user error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const userId = params.id;

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Invalid user ID',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user exists
    const userResult = await rawDb.execute({
      sql: 'SELECT id FROM user WHERE id = ?',
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'User not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete associated sessions first
    await rawDb.execute({
      sql: 'DELETE FROM session WHERE userId = ?',
      args: [userId]
    });

    // Delete associated accounts
    await rawDb.execute({
      sql: 'DELETE FROM account WHERE userId = ?',
      args: [userId]
    });

    // Delete order_status_history entries (if user was the one who changed status)
    await rawDb.execute({
      sql: 'DELETE FROM order_status_history WHERE changedBy = ?',
      args: [userId]
    });

    // Finally delete the user
    await rawDb.execute({
      sql: 'DELETE FROM user WHERE id = ?',
      args: [userId]
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'User deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete user error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const userId = params.id;

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Invalid user ID',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user exists
    const userResult = await rawDb.execute({
      sql: 'SELECT * FROM user WHERE id = ?',
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'User not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const updates: string[] = [];
    const args: any[] = [];

    // Allowed fields to update
    if (body.name !== undefined) {
      updates.push('name = ?');
      args.push(body.name);
    }
    if (body.username !== undefined) {
      updates.push('username = ?');
      args.push(body.username);
    }
    if (body.email !== undefined) {
      updates.push('email = ?');
      args.push(body.email);
    }
    if (body.role !== undefined) {
      updates.push('role = ?');
      args.push(body.role);
    }
    if (body.emailVerified !== undefined) {
      updates.push('emailVerified = ?');
      args.push(body.emailVerified ? 1 : 0);
    }
    if (body.image !== undefined) {
      updates.push('image = ?');
      // Allow empty string to delete image
      args.push(body.image || null);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        error: 'No valid fields to update',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add updatedAt timestamp
    updates.push('updatedAt = ?');
    args.push(Date.now());

    // Add userId for WHERE clause
    args.push(userId);

    await rawDb.execute({
      sql: `UPDATE user SET ${updates.join(', ')} WHERE id = ?`,
      args
    });

    // Fetch updated user
    const updatedUserResult = await rawDb.execute({
      sql: 'SELECT * FROM user WHERE id = ?',
      args: [userId]
    });

    const updatedUser = updatedUserResult.rows[0];

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: String(updatedUser.id),
        name: String(updatedUser.name),
        username: updatedUser.username ? String(updatedUser.username) : null,
        email: String(updatedUser.email),
        role: String(updatedUser.role),
        emailVerified: Boolean(updatedUser.emailVerified),
        image: updatedUser.image ? String(updatedUser.image) : null,
        lastLoginAt: updatedUser.lastLoginAt ? String(updatedUser.lastLoginAt) : null,
        createdAt: String(updatedUser.createdAt),
        updatedAt: String(updatedUser.updatedAt),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Update user error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
