import type { APIRoute } from 'astro';
import { requireAdminAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { user, session } from '@/lib/schema';
import { desc, asc, like, or, count, max, eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  try {
    // Check if user is admin
    const authResult = await requireAdminAuth(context);
    if (authResult instanceof Response) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(context.request.url);
    const searchParams = url.searchParams;

    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(user.name, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }

    if (role) {
      conditions.push(like(user.role, role));
    }

    // Build sort order
    let sortField;
    switch (sortBy) {
      case 'name':
        sortField = user.name;
        break;
      case 'email':
        sortField = user.email;
        break;
      case 'role':
        sortField = user.role;
        break;
      case 'emailVerified':
        sortField = user.emailVerified;
        break;
      case 'createdAt':
        sortField = user.createdAt;
        break;
      default:
        sortField = user.createdAt;
    }
    const orderClause = sortOrder === 'asc' ? asc(sortField) : desc(sortField);

    // Build where clause
    const whereClause = conditions.length === 0 ? undefined :
      conditions.length === 1 ? conditions[0] :
      conditions.reduce((acc, condition) => acc && condition);

    // Get users
    const baseQuery = db.select().from(user);
    const users = await (whereClause ?
      baseQuery.where(whereClause) :
      baseQuery)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    // Get last login info for each user
    const usersWithLastLogin = await Promise.all(users.map(async (u) => {
      const lastSession = await db.select({ createdAt: session.createdAt })
        .from(session)
        .where(eq(session.userId, u.id))
        .orderBy(desc(session.createdAt))
        .limit(1);

      return {
        ...u,
        lastLoginAt: lastSession[0]?.createdAt || null
      };
    }));

    // Get total count for pagination
    const countQuery = db.select({ count: count() }).from(user);
    const [{ count: total }] = await (whereClause ?
      countQuery.where(whereClause) :
      countQuery);

    return new Response(JSON.stringify({
      success: true,
      users: usersWithLastLogin.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: u.emailVerified,
        image: u.image,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};