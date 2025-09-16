// src/pages/api/coupons/validate.ts
import type { APIRoute } from 'astro';
import { validateCoupon, initializeCouponsTable } from '../../../lib/coupons';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Initialize tables on first request
    await initializeCouponsTable();

    const { code, orderAmount, customerEmail } = await request.json();

    if (!code || orderAmount === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Coupon code and order amount are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await validateCoupon(code, parseFloat(orderAmount), customerEmail);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to validate coupon'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};