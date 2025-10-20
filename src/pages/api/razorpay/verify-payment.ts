// src/pages/api/razorpay/verify-payment.ts
import type { APIRoute } from 'astro';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createOrder } from '../../../lib/orders';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { recordDiscountUsage } from '../../../lib/discounts';
import { rawDb as db } from '../../../lib/db';

const razorpay = new Razorpay({
  key_id: import.meta.env.RAZORPAY_KEY_ID,
  key_secret: import.meta.env.RAZORPAY_KEY_SECRET,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = await request.json();

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderData
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required payment verification data',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify payment signature
    const hmac = crypto.createHmac(
      'sha256',
      import.meta.env.RAZORPAY_KEY_SECRET
    );
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment verification failed',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // console.log('Payment signature verified successfully');

    // Fetch payment details from Razorpay
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      // console.log('Payment details:', paymentDetails);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch payment details',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify payment status
    if (paymentDetails.status !== 'captured') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment not captured',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create order in database with payment information
    const enhancedOrderData = {
      ...orderData,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paymentStatus: 'completed',
      paymentMethod: paymentDetails.method || 'razorpay',
    };

    // console.log('Creating order with payment data:', enhancedOrderData);

    const { orderId, customerId } = await createOrder(enhancedOrderData);

    // console.log(`Order created successfully: Order ID ${orderId}, Customer ID ${customerId}`);

    // Record discount usage if a discount was applied
    if (orderData.couponCode && orderData.couponDiscount > 0) {
      try {
        // We need to get the discount ID first
        const discountResult = await db.execute({
          sql: 'SELECT id FROM discounts WHERE code = ?',
          args: [orderData.couponCode],
        });

        if (discountResult.rows.length > 0) {
          const discountId = Number(discountResult.rows[0].id);
          await recordDiscountUsage(
            discountId,
            orderId,
            orderData.email,
            orderData.couponDiscount
          );
          // console.log(`Discount usage recorded: ${orderData.couponCode} for order ${orderId}`);
        }
      } catch (discountError) {
        console.error('Error recording discount usage:', discountError);
        // Don't fail the order if discount usage recording fails
      }
    }

    // Prepare email data
    const emailData = {
      customerName: `${orderData.firstName} ${orderData.lastName}`,
      customerEmail: orderData.email,
      orderId: orderId,
      orderDate: new Date(
        new Date().getTime() + 5.5 * 60 * 60 * 1000
      ).toISOString(),
      items: orderData.cartItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: orderData.subtotal,
      couponCode: orderData.couponCode || null,
      couponDiscount: orderData.couponDiscount || 0,
      discountedSubtotal: orderData.discountedSubtotal || orderData.subtotal,
      shipping: orderData.shipping,
      tax: orderData.tax,
      total: orderData.total,
      paymentId: razorpay_payment_id,
      shippingAddress: {
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        zipCode: orderData.zipCode,
      },
    };

    // Send order confirmation email
    let emailSent = false;
    try {
      emailSent = await sendOrderConfirmationEmail(emailData);
      if (emailSent) {
        // console.log('Order confirmation email sent successfully');
      } else {
        console.warn('Failed to send order confirmation email');
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Don't fail the order if email fails - just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        customerId,
        paymentId: razorpay_payment_id,
        emailSent,
        redirectUrl: `/order-success?orderId=${orderId}&paymentId=${razorpay_payment_id}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Payment verification failed',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
