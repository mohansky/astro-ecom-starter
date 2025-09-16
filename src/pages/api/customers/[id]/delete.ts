// src/pages/api/customers/[id]/delete.ts
import { rawDb } from '@/lib/db';
import type { APIRoute } from 'astro'; 

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const customerId = parseInt(params.id || '0');
    
    if (!customerId || isNaN(customerId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid customer ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if customer has any orders
    const ordersResult = await rawDb.execute({
      sql: `SELECT COUNT(*) as order_count FROM orders WHERE customer_id = ?`,
      args: [customerId]
    });

    const orderCount = Number(ordersResult.rows[0].order_count);

    if (orderCount > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot delete customer with ${orderCount} existing order${orderCount > 1 ? 's' : ''}. Please delete all orders first.`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the customer
    const result = await rawDb.execute({
      sql: `DELETE FROM customers WHERE id = ?`,
      args: [customerId]
    });

    if (result.rowsAffected === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Customer not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Customer deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Delete customer API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete customer. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  // Support DELETE method as well
  try {
    const customerId = parseInt(params.id || '0');
    
    if (!customerId || isNaN(customerId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid customer ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if customer has any orders
    const ordersResult = await rawDb.execute({
      sql: `SELECT COUNT(*) as order_count FROM orders WHERE customer_id = ?`,
      args: [customerId]
    });

    const orderCount = Number(ordersResult.rows[0].order_count);

    if (orderCount > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `Cannot delete customer with ${orderCount} existing order${orderCount > 1 ? 's' : ''}. Please delete all orders first.`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await rawDb.execute({
      sql: `DELETE FROM customers WHERE id = ?`,
      args: [customerId]
    });

    if (result.rowsAffected === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Customer not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Customer deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Delete customer API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete customer. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};