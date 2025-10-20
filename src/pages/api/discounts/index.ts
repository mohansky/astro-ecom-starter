// src/pages/api/discounts/index.ts
import type { APIRoute } from 'astro';
import { getAllDiscounts, createDiscount, initializeDiscountsTable } from '../../../lib/discounts';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Initialize tables on first request
    await initializeDiscountsTable();

    const searchParams = new URL(url).searchParams;
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const filters = {
      search: search.trim() || undefined,
      isActive: isActive !== null ? isActive === 'true' : undefined,
      limit,
      offset
    };

    const { discounts, total } = await getAllDiscounts(filters);

    return new Response(JSON.stringify({
      success: true,
      coupons: discounts, // Keep 'coupons' key for backward compatibility
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch discounts'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    const requiredFields = ['code', 'description', 'discountType', 'discountValue', 'minimumOrderAmount', 'validFrom', 'validTo'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return new Response(JSON.stringify({
          success: false,
          error: `Missing required field: ${field}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(data.discountType)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid discount type. Must be "percentage" or "fixed"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate discount value
    if (data.discountValue <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Discount value must be greater than 0'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate percentage discount
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Percentage discount cannot exceed 100%'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate dates
    const validFrom = new Date(data.validFrom);
    const validTo = new Date(data.validTo);

    if (validTo <= validFrom) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid to date must be after valid from date'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const discount = await createDiscount({
      code: data.code.trim().toUpperCase(),
      description: data.description.trim(),
      discountType: data.discountType,
      discountValue: parseFloat(data.discountValue),
      minimumOrderAmount: parseFloat(data.minimumOrderAmount || 0),
      maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : undefined,
      isActive: data.isActive !== false,
      validFrom: data.validFrom,
      validTo: data.validTo,
      usageLimit: data.usageLimit ? parseInt(data.usageLimit) : undefined
    });

    return new Response(JSON.stringify({
      success: true,
      coupon: discount, // Return as 'coupon' for backward compatibility
      message: 'Discount created successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);

    // Handle unique constraint violation
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'A discount with this code already exists'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create discount'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};