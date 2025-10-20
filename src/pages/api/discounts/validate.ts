// src/pages/api/discounts/validate.ts
import type { APIRoute } from 'astro';
import {
  validateDiscount,
  initializeDiscountsTable,
} from '../../../lib/discounts';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Initialize tables on first request
    await initializeDiscountsTable();

    const {
      code,
      orderAmount: rawAmount,
      customerEmail,
    } = await request.json();

    if (!code || rawAmount == null) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Discount code and order amount are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const orderAmount = parseFloat(rawAmount);
    if (isNaN(orderAmount) || orderAmount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order amount must be a valid positive number',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await validateDiscount(code, orderAmount, customerEmail);
    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to validate discount',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
