// src/pages/api/customers/index.ts
import { rawDb } from '../../../lib/db';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone_number,
        c.address,
        c.city,
        c.state,
        c.zip_code,
        c.created_at,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
    `;

    const args: any[] = [];

    if (search.trim()) {
      sql += `
        WHERE (
          c.first_name LIKE ? OR
          c.last_name LIKE ? OR
          c.email LIKE ? OR
          (c.first_name || ' ' || c.last_name) LIKE ?
        )
      `;
      const searchTerm = `%${search.trim()}%`;
      args.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += `
      GROUP BY c.id
      ORDER BY c.last_name, c.first_name
      LIMIT ? OFFSET ?
    `;
    args.push(limit, offset);

    const result = await rawDb.execute({ sql, args });

    const customers = result.rows.map(row => ({
      id: Number(row.id),
      firstName: String(row.first_name),
      lastName: String(row.last_name),
      email: String(row.email),
      phoneNumber: String(row.phone_number || ''),
      address: String(row.address),
      city: String(row.city),
      state: String(row.state),
      zipCode: String(row.zip_code),
      createdAt: String(row.created_at),
      orderCount: Number(row.order_count),
      totalSpent: Number(row.total_spent)
    }));

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM customers c';
    const countArgs: any[] = [];

    if (search.trim()) {
      countSql += `
        WHERE (
          c.first_name LIKE ? OR
          c.last_name LIKE ? OR
          c.email LIKE ? OR
          (c.first_name || ' ' || c.last_name) LIKE ?
        )
      `;
      const searchTerm = `%${search.trim()}%`;
      countArgs.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const countResult = await rawDb.execute({ sql: countSql, args: countArgs });
    const totalCount = Number(countResult.rows[0]?.total || 0);

    return new Response(JSON.stringify({
      success: true,
      customers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch customers',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};