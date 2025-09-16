// src/pages/api/orders/[id]/delete.ts
import { deleteOrder } from '@/lib/orders';
import type { APIRoute } from 'astro'; 

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const orderId = parseInt(params.id || '0');
    
    if (!orderId || isNaN(orderId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid order ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the order
    const deleted = await deleteOrder(orderId);

    if (!deleted) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found or could not be deleted'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Order deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Delete order API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete order. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  // Support DELETE method as well
  try {
    const orderId = parseInt(params.id || '0');
    
    if (!orderId || isNaN(orderId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid order ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deleted = await deleteOrder(orderId);

    if (!deleted) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found or could not be deleted'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Order deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Delete order API error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to delete order. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};