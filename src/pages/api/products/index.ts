// src/pages/api/products/index.ts
import type { APIRoute } from 'astro';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, type Product } from '@/lib/db';
import { requireUserOrAdminAuth } from '@/lib/auth-utils';

export const GET: APIRoute = async (context) => {
  try {
    // Check authentication
    const authResult = await requireUserOrAdminAuth(context);
    if (authResult instanceof Response) {
      return authResult;
    }

    const searchParams = new URL(context.request.url).searchParams;
    const id = searchParams.get('id');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    // Handle isActive parameter: undefined = show all, 'true' = active only, 'false' = inactive only
    const isActiveParam = searchParams.get('isActive');
    const isActive = isActiveParam === null ? undefined : isActiveParam !== 'false';

    // If requesting a specific product by ID
    if (id) {
      const product = await getProductById(id);
      if (!product) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Product not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        products: [product]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all products with filters
    const result = await getAllProducts({
      search,
      category,
      limit,
      offset,
      isActive
    });

    return new Response(JSON.stringify({
      success: true,
      products: result.products,
      categories: result.categories,
      pagination: result.pagination
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch products'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    const authResult = await requireUserOrAdminAuth(context);
    if (authResult instanceof Response) {
      return authResult;
    }

    const productData = await context.request.json();

    // Create product
    const productId = await createProduct(productData);

    return new Response(JSON.stringify({
      success: true,
      productId,
      message: 'Product created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating product:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create product'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    // Check authentication
    const authResult = await requireUserOrAdminAuth(context);
    if (authResult instanceof Response) {
      return authResult;
    }

    const searchParams = new URL(context.request.url).searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const productData = await context.request.json();

    // Update product
    const success = await updateProduct(id, productData);

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found or update failed'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Product updated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error updating product:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to update product'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    // Check authentication
    const authResult = await requireUserOrAdminAuth(context);
    if (authResult instanceof Response) {
      return authResult;
    }

    const searchParams = new URL(context.request.url).searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete product
    const success = await deleteProduct(id);

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found or delete failed'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Product deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error deleting product:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to delete product'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};