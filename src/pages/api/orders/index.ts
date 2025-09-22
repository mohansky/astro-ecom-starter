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

    return new Response(JSON.stringify({
      success: true,
      ...result
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