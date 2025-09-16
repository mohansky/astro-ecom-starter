import type { APIRoute } from 'astro';
import { cancelOrder } from '@/lib/orders';

export const POST: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const orderId = parseInt(id as string);
    if (isNaN(orderId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid order ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const success = await cancelOrder(orderId);

    if (success) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Order cancelled successfully and stock restored'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to cancel order'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error cancelling order:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};