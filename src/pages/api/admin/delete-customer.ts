import type { APIRoute } from 'astro';
import { requireAdminAuth } from '@/lib/auth-utils';
import { rawDb as db } from '@/lib/db';

const deleteCustomerHandler = async (context: any) => {
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
    const { customerId } = body;

    if (!customerId) {
      return new Response(JSON.stringify({ error: 'Missing customerId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete related data first (order_items, then orders)
    await db.execute({
      sql: `
        DELETE FROM order_items
        WHERE order_id IN (
          SELECT id FROM orders WHERE customer_id = ?
        )
      `,
      args: [customerId]
    });

    // Delete orders
    await db.execute({
      sql: `DELETE FROM orders WHERE customer_id = ?`,
      args: [customerId]
    });

    // Delete customer
    const result = await db.execute({
      sql: `DELETE FROM customers WHERE id = ?`,
      args: [customerId]
    });

    if (result.rowsAffected === 0) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = deleteCustomerHandler;
export const POST: APIRoute = deleteCustomerHandler;