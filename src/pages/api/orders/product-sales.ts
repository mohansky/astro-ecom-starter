// src/pages/api/orders/product-sales.ts
import { rawDb } from '../../../lib/db';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get date range from query parameters, default to 365 days (1 year)
    const searchParams = new URL(url).searchParams;
    const days = searchParams.get('days') || '365';

    const result = await rawDb.execute({
      sql: `
        SELECT
          oi.product_name,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.quantity * oi.price) as total_revenue,
          COUNT(DISTINCT o.id) as order_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= date('now', '-${days} days')
        GROUP BY oi.product_id, oi.product_name
        ORDER BY total_revenue DESC
        LIMIT 10
      `
    });

    const productSales = result.rows.map(row => ({
      productName: String(row.product_name),
      totalQuantity: Number(row.total_quantity),
      totalRevenue: Number(row.total_revenue),
      orderCount: Number(row.order_count)
    }));

    return new Response(JSON.stringify(productSales, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to fetch product sales data',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};