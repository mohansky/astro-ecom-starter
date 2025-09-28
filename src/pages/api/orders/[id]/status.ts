import type { APIRoute } from 'astro';
import { requireAdminAuth } from '@/lib/auth-utils';
import { updateOrderStatus } from '@/lib/orders';

export const PATCH: APIRoute = async (context) => {
  try {
    // Check if user is admin
    const authResult = await requireAdminAuth(context);
    if (authResult instanceof Response) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = context.params;
    const orderId = parseInt(id || '0');

    if (!orderId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid order ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await context.request.json();
    const { status, notes } = requestBody;

    if (!status) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Status is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Valid statuses
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid status'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await updateOrderStatus(orderId, status, authResult.id, notes);

    return new Response(JSON.stringify({
      success: true,
      message: 'Order status updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};