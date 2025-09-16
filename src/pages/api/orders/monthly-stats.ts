// src/pages/api/orders/monthly-stats.ts
import { rawDb } from '../../../lib/db';
import type { APIRoute } from 'astro';

 

export const GET: APIRoute = async ({ url }) => {
  try {
    // console.log('API: Starting monthly stats query...');

    // Get date range from query parameters, default to 12 months
    const searchParams = new URL(url).searchParams;
    const days = searchParams.get('days') || '365'; // Default to 12 months (365 days)

    const result = await rawDb.execute({
      sql: `
        SELECT
          strftime('%Y-%m', created_at) as month,
          COUNT(*) as order_count,
          SUM(total) as total_revenue
        FROM orders
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC
      `
    });

    // console.log('API: Query result rows:', result.rows);

    const monthlyData = result.rows.map(row => ({
      month: String(row.month),
      orderCount: Number(row.order_count),
      totalRevenue: Number(row.total_revenue)
    }));

    // console.log('API: Formatted data:', monthlyData);

    return new Response(JSON.stringify(monthlyData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Error:', error);

    return new Response(JSON.stringify({ 
      error: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};