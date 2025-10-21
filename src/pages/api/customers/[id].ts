// src/pages/api/customers/[id].ts
import { rawDb } from '../../../lib/db';
import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const customerId = parseInt(params.id || '0');

    if (!customerId || isNaN(customerId)) {
      return new Response(JSON.stringify({
        error: 'Invalid customer ID',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if customer exists
    const customerResult = await rawDb.execute({
      sql: 'SELECT id FROM customers WHERE id = ?',
      args: [customerId]
    });

    if (customerResult.rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'Customer not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete associated orders first (cascade delete)
    // First delete order_items (uses snake_case order_id)
    await rawDb.execute({
      sql: `
        DELETE FROM order_items
        WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ?)
      `,
      args: [customerId]
    });

    // Delete order_status_history (uses camelCase orderId)
    await rawDb.execute({
      sql: `
        DELETE FROM order_status_history
        WHERE orderId IN (SELECT id FROM orders WHERE customer_id = ?)
      `,
      args: [customerId]
    });

    // Then delete orders
    await rawDb.execute({
      sql: 'DELETE FROM orders WHERE customer_id = ?',
      args: [customerId]
    });

    // Finally delete the customer
    await rawDb.execute({
      sql: 'DELETE FROM customers WHERE id = ?',
      args: [customerId]
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Customer and associated orders deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete customer error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to delete customer',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ params }) => {
  try {
    const customerId = parseInt(params.id || '0');

    if (!customerId || isNaN(customerId)) {
      return new Response(JSON.stringify({
        error: 'Invalid customer ID',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get customer information
    const customerResult = await rawDb.execute({
      sql: `
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
        WHERE c.id = ?
        GROUP BY c.id
      `,
      args: [customerId]
    });

    if (customerResult.rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'Customer not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const customer = customerResult.rows[0];

    // Get customer's orders
    const ordersResult = await rawDb.execute({
      sql: `
        SELECT
          o.id,
          o.created_at as date,
          o.total,
          o.status,
          COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 20
      `,
      args: [customerId]
    });

    const orders = ordersResult.rows.map(order => ({
      id: Number(order.id),
      date: String(order.date),
      total: Number(order.total),
      status: String(order.status),
      itemCount: Number(order.item_count)
    }));

    const customerDetail = {
      id: Number(customer.id),
      firstName: String(customer.first_name),
      lastName: String(customer.last_name),
      email: String(customer.email),
      phoneNumber: String(customer.phone_number || ''),
      address: String(customer.address),
      city: String(customer.city),
      state: String(customer.state),
      zipCode: String(customer.zip_code),
      createdAt: String(customer.created_at),
      orderCount: Number(customer.order_count),
      totalSpent: Number(customer.total_spent),
      orders
    };

    return new Response(JSON.stringify(customerDetail, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API Error:', error);

    return new Response(JSON.stringify({
      error: 'Failed to fetch customer details',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};