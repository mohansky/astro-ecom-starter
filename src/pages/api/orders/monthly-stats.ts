// src/pages/api/orders/monthly-stats.ts
import { rawDb } from '../../../lib/db';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get date range from query parameters, default to 12 months
    const searchParams = new URL(url).searchParams;
    const daysParam = searchParams.get('days') || '365';
    const days = parseInt(daysParam, 10);

    if (isNaN(days) || days <= 0) {
      return new Response(
        JSON.stringify(
          {
            error: 'Invalid days parameter',
            message: 'The days parameter must be a positive integer',
          },
          null,
          2
        ),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    // Determine grouping format based on days
    let groupBy: string;
    let labelColumn: string;

    if (days <= 7) {
      // 7 days: group by day
      groupBy = "strftime('%Y-%m-%d', created_at)";
      labelColumn = 'date';
    } else if (days <= 30) {
      // 30 days: group by week
      groupBy = "strftime('%Y-W%W', created_at)";
      labelColumn = 'week';
    } else {
      // 90 days or 1 year: group by month
      groupBy = "strftime('%Y-%m', created_at)";
      labelColumn = 'month';
    }

    const result = await rawDb.execute({
      sql: `
        SELECT
          ${groupBy} as period,
          COUNT(*) as order_count,
          SUM(total) as total_revenue
        FROM orders
        WHERE created_at >= date('now', '-' || ? || ' days')
        GROUP BY ${groupBy}
        ORDER BY period ASC
      `,
      args: [days],
    });

    const statsData = result.rows.map((row) => ({
      period: String(row.period),
      orderCount: Number(row.order_count),
      totalRevenue: Number(row.total_revenue),
    }));

    return new Response(JSON.stringify(statsData, null, 2), {
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
          error: 'Failed to fetch data',
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
