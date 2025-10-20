// src/pages/api/products/index.ts
import type { APIRoute } from 'astro';
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, type Product } from '@/lib/db';
import { requireUserOrAdminAuth } from '@/lib/auth-utils';
import { moveProductImagesInR2 } from '@/lib/r2-utils';
import { generateSlug } from '@/lib/slug-utils';

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

    // Fetch the created product to return full details
    const product = await getProductById(productId);

    return new Response(JSON.stringify({
      success: true,
      product,
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

    // Get current product to check if slug changed
    const currentProduct = await getProductById(id);
    if (!currentProduct) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Product not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if slug changed
    const newSlug = productData.slug || generateSlug(productData.name);
    const oldSlug = currentProduct.slug;
    const slugChanged = newSlug !== oldSlug;

    // If slug changed, move images in R2
    if (slugChanged && currentProduct.images && currentProduct.images.length > 0) {
      console.log(`Slug changed from "${oldSlug}" to "${newSlug}", moving images...`);

      const r2Config = {
        accountId: import.meta.env.CLOUDFLARE_ACCOUNT_ID,
        accessKeyId: import.meta.env.R2_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.R2_SECRET_ACCESS_KEY,
        bucketName: import.meta.env.R2_BUCKET_NAME,
      };

      const moveResult = await moveProductImagesInR2(oldSlug, newSlug, r2Config);

      if (!moveResult.success) {
        console.error('Failed to move images:', moveResult.error);
        // Continue with update even if image move fails
        // User can re-upload images if needed
      } else {
        console.log(`Successfully moved ${moveResult.movedCount} images`);
      }
    }

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

    // Fetch updated product to return
    const updatedProduct = await getProductById(id);

    return new Response(JSON.stringify({
      success: true,
      product: updatedProduct,
      message: slugChanged
        ? 'Product updated and images moved successfully'
        : 'Product updated successfully'
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