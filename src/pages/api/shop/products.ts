// src/pages/api/shop/products.ts
import type { APIRoute } from 'astro';
import { getAllProducts } from '@/lib/db';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URLSearchParams(url.search);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Public API - only show active products
    const result = await getAllProducts({
      search,
      category,
      limit,
      offset,
      isActive: true
    });

    return new Response(JSON.stringify({
      success: true,
      products: result.products,
      categories: result.categories,
      pagination: result.pagination
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error: any) {
    console.error('Public API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch products'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};