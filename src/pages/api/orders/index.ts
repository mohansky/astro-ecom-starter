// src/pages/api/orders/index.ts
import type { APIRoute } from 'astro';
import { getOrdersPaginated } from '@/lib/orders';

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const searchParams = new URLSearchParams(url.search);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const result = await getOrdersPaginated({
      limit,
      offset,
      search,
      status
    });

    // Transform the orders to match the expected Order interface
    const transformedOrders = result.orders.map(order => ({
      id: order.id.toString(),
      orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`,
      customerName: order.customerName,
      customerEmail: '', // This would need to be added to the orders query if needed
      items: Array.from({ length: order.itemCount }, (_, i) => ({
        id: i + 1,
        productId: '',
        productName: '',
        quantity: 1,
        price: 0,
      })),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }));

    return new Response(JSON.stringify({
      success: true,
      orders: transformedOrders,
      pagination: result.pagination,
      statuses: result.statuses || [],
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch orders'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};