// src/pages/api/orders/recent.ts
import { rawDb } from '../../../lib/db';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await rawDb.execute({
      sql: `
        SELECT
          o.id,
          o.total,
          o.status,
          o.created_at,
          (c.first_name || ' ' || c.last_name) as customer_name,
          c.email as customer_email,
          COUNT(oi.id) as item_count
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT ${limit}
      `,
    });

    const recentOrders = result.rows.map((row) => ({
      id: String(row.id),
      orderNumber: `ORD-${String(row.id || 0).padStart(6, '0')}`,
      customerName: String(row.customer_name),
      customerEmail: String(row.customer_email),
      total: Number(row.total),
      status: String(row.status),
      itemCount: Number(row.item_count),
      createdAt: String(row.created_at),
    }));

    return new Response(JSON.stringify(recentOrders, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Error:', error);

    return new Response(
      JSON.stringify(
        {
          error: 'Failed to fetch recent orders',
          message:
            error instanceof Error ? error.message : 'Unknown error occurred',
        },
        null,
        2
      ),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
