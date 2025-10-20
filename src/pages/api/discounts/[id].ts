// src/pages/api/discounts/[id].ts
import type { APIRoute } from 'astro';
import { getDiscountById, updateDiscount, deleteDiscount } from '../../../lib/discounts';

export const GET: APIRoute = async ({ params }) => {
  try {
    const discountId = parseInt(params.id || '0');

    if (!discountId || isNaN(discountId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid discount ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const discount = await getDiscountById(discountId);

    if (!discount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Discount not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      coupon: discount // Return as 'coupon' for backward compatibility
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch discount'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const discountId = parseInt(params.id || '0');

    if (!discountId || isNaN(discountId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid discount ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();

    // Validate discount type if provided
    if (data.discountType && !['percentage', 'fixed'].includes(data.discountType)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid discount type. Must be "percentage" or "fixed"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate discount value if provided
    if (data.discountValue !== undefined && data.discountValue <= 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Discount value must be greater than 0'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate percentage discount if provided
    if (data.discountType === 'percentage' && data.discountValue > 100) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Percentage discount cannot exceed 100%'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate dates if provided
    if (data.validFrom && data.validTo) {
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
    }

    // Prepare update data
    const updateData: any = {};

    if (data.code !== undefined) updateData.code = data.code.trim().toUpperCase();
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = parseFloat(data.discountValue);
    if (data.minimumOrderAmount !== undefined) updateData.minimumOrderAmount = parseFloat(data.minimumOrderAmount);
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
    if (data.validTo !== undefined) updateData.validTo = data.validTo;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit ? parseInt(data.usageLimit) : null;

    const discount = await updateDiscount(discountId, updateData);

    if (!discount) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Discount not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      coupon: discount, // Return as 'coupon' for backward compatibility
      message: 'Discount updated successfully'
    }), {
      status: 200,
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
      error: error.message || 'Failed to update discount'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const discountId = parseInt(params.id || '0');

    if (!discountId || isNaN(discountId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid discount ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const success = await deleteDiscount(discountId);

    if (!success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Discount not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Discount deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to delete discount'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};