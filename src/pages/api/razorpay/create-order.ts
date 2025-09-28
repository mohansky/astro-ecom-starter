// src/pages/api/razorpay/create-order.ts
import type { APIRoute } from 'astro';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: import.meta.env.RAZORPAY_KEY_ID,
  key_secret: import.meta.env.RAZORPAY_KEY_SECRET,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = await request.json();

    // Validate required fields
    if (!amount || !receipt) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Amount and receipt are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paisa
      currency,
      receipt,
      notes: notes || {},
      payment_capture: 1, // Auto capture payment
    };

    // console.log('Creating Razorpay order with options:', options);

    const order = await razorpay.orders.create(options);

    // console.log('Razorpay order created:', order);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to create Razorpay order',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
