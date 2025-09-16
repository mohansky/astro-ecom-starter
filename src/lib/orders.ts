// src/lib/orders.ts
import { rawDb as db, processStockDeduction, restoreStock } from './db';
import { recordCouponUsage, getCouponByCode } from './coupons';

// Helper function to get IST datetime string
function getISTDatetime(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
  return istTime.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19);
}

// Initialize orders table with coupon support
export async function initializeOrdersTable() {
  try {
    // Add coupon columns to existing orders table if they don't exist
    await db.execute({
      sql: `
        ALTER TABLE orders ADD COLUMN coupon_code TEXT;
      `
    }).catch(() => {}); // Ignore error if column already exists

    await db.execute({
      sql: `
        ALTER TABLE orders ADD COLUMN coupon_discount REAL DEFAULT 0;
      `
    }).catch(() => {}); // Ignore error if column already exists

    // console.log('Orders table updated with coupon support');
  } catch (error) {
    console.error('Error updating orders table:', error);
  }
}

export interface OrderSummary {
  id: number;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  itemCount: number;
  couponCode?: string | null;
  couponDiscount?: number;
}

export interface OrderDetail {
  id: number;
  customerId: number;
  customerName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  subtotal: number;
  couponCode: string | null;
  couponDiscount: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

// Function to get all orders with basic summary info
export async function getAllOrders(): Promise<OrderSummary[]> {
  try {
    // Initialize orders table on first use
    await initializeOrdersTable();
    const result = await db.execute({
      sql: `
        SELECT
          o.id,
          (c.first_name || ' ' || c.last_name) AS customer_name,
          o.total,
          o.status,
          o.created_at,
          o.coupon_code,
          o.coupon_discount,
          COUNT(oi.id) AS item_count
        FROM
          orders o
        JOIN
          customers c ON o.customer_id = c.id
        LEFT JOIN
          order_items oi ON o.id = oi.order_id
        GROUP BY
          o.id
        ORDER BY
          o.created_at DESC
      `
    });

    return result.rows.map(row => ({
      id: Number(row.id),
      customerName: row.customer_name as string,
      total: Number(row.total),
      status: row.status as string,
      createdAt: row.created_at as string,
      itemCount: Number(row.item_count),
      couponCode: row.coupon_code as string | null,
      couponDiscount: Number(row.coupon_discount || 0)
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

// Function to get detailed order information
export async function getOrderById(orderId: number): Promise<OrderDetail | null> {
  try {
    // Initialize orders table on first use
    await initializeOrdersTable();
    // Get order and customer information
    const orderResult = await db.execute({
      sql: `
        SELECT
          o.*,
          c.first_name,
          c.last_name,
          c.email,
          c.phone_number,
          c.address,
          c.city,
          c.state,
          c.zip_code
        FROM
          orders o
        JOIN
          customers c ON o.customer_id = c.id
        WHERE
          o.id = ?
      `,
      args: [orderId]
    });

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await db.execute({
      sql: `
        SELECT * FROM order_items
        WHERE order_id = ?
      `,
      args: [orderId]
    });

    const items: OrderItem[] = itemsResult.rows.map(item => ({
      id: Number(item.id),
      productId: item.product_id as string,
      productName: item.product_name as string,
      price: Number(item.price),
      quantity: Number(item.quantity),
      total: Number(item.total)
    }));

    return {
      id: Number(order.id),
      customerId: Number(order.customer_id),
      customerName: `${order.first_name} ${order.last_name}`,
      email: order.email as string,
      phoneNumber: String(order.phone_number || ''),
      address: order.address as string,
      city: order.city as string,
      state: order.state as string,
      zipCode: order.zip_code as string,
      subtotal: Number(order.subtotal),
      couponCode: order.coupon_code as string | null,
      couponDiscount: Number(order.coupon_discount || 0),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      total: Number(order.total),
      status: order.status as string,
      createdAt: order.created_at as string,
      items
    };
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    throw error;
  }
}

// Function to update order status
export async function updateOrderStatus(orderId: number, status: string): Promise<void> {
  try {
    await db.execute({
      sql: `
        UPDATE orders
        SET status = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [status, getISTDatetime(), orderId]
    });
  } catch (error) {
    console.error(`Error updating order ${orderId} status:`, error);
    throw error;
  }
}

// Function to delete an order and its related data
export async function deleteOrder(orderId: number): Promise<boolean> {
  try {
    // First, get order items to restore stock
    const itemsResult = await db.execute({
      sql: `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
      args: [orderId]
    });

    // Restore stock for all items
    if (itemsResult.rows.length > 0) {
      const stockItems = itemsResult.rows.map(item => ({
        id: item.product_id as string,
        quantity: item.quantity as number
      }));

      try {
        await restoreStock(stockItems);
        console.log(`Stock restored for deleted order ${orderId}`);
      } catch (stockError) {
        console.error(`Failed to restore stock for deleted order ${orderId}:`, stockError);
        // Continue with deletion even if stock restoration fails
      }
    }

    // Delete order items
    await db.execute({
      sql: `DELETE FROM order_items WHERE order_id = ?`,
      args: [orderId]
    });

    // Then delete the order
    const result = await db.execute({
      sql: `DELETE FROM orders WHERE id = ?`,
      args: [orderId]
    });

    return result.rowsAffected > 0;
  } catch (error) {
    console.error(`Error deleting order ${orderId}:`, error);
    throw error;
  }
}

// Function to cancel an order (sets status to cancelled and restores stock)
export async function cancelOrder(orderId: number): Promise<boolean> {
  try {
    // First, check if order exists and is not already cancelled
    const orderResult = await db.execute({
      sql: `SELECT status FROM orders WHERE id = ?`,
      args: [orderId]
    });

    if (orderResult.rows.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const currentStatus = orderResult.rows[0].status as string;
    if (currentStatus === 'cancelled') {
      return true; // Already cancelled
    }

    // Get order items to restore stock
    const itemsResult = await db.execute({
      sql: `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
      args: [orderId]
    });

    // Restore stock for all items
    if (itemsResult.rows.length > 0) {
      const stockItems = itemsResult.rows.map(item => ({
        id: item.product_id as string,
        quantity: item.quantity as number
      }));

      await restoreStock(stockItems);
      console.log(`Stock restored for cancelled order ${orderId}`);
    }

    // Update order status to cancelled
    const result = await db.execute({
      sql: `
        UPDATE orders
        SET status = 'cancelled', updated_at = ?
        WHERE id = ?
      `,
      args: [getISTDatetime(), orderId]
    });

    return result.rowsAffected > 0;
  } catch (error) {
    console.error(`Error cancelling order ${orderId}:`, error);
    throw error;
  }
}

// Function to create a new order with customer
export async function createOrder(orderData: {
  // Customer information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  // Order information
  cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  couponCode?: string | null;
  couponDiscount?: number;
  shipping: number;
  tax: number;
  total: number;
  // Payment information (optional for backward compatibility)
  paymentId?: string;
  razorpayOrderId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
}): Promise<{ orderId: number; customerId: number }> {
  try {
    // Initialize orders table on first use
    await initializeOrdersTable();

    // First, validate and process stock deduction
    const stockItems = orderData.cartItems.map(item => ({
      id: item.id,
      quantity: item.quantity
    }));

    const stockResult = await processStockDeduction(stockItems);
    if (!stockResult.success) {
      throw new Error(`Stock validation failed: ${stockResult.errors.join(', ')}`);
    }

    // Start a transaction-like approach by checking if customer exists first
    let customerId: number;

    // Check if customer exists by email
    const existingCustomerResult = await db.execute({
      sql: `SELECT id FROM customers WHERE email = ?`,
      args: [orderData.email]
    });

    if (existingCustomerResult.rows.length > 0) {
      customerId = Number(existingCustomerResult.rows[0].id);
      
      // Update existing customer with new info (in case they changed address, phone, etc.)
      await db.execute({
        sql: `
          UPDATE customers 
          SET first_name = ?, last_name = ?, phone_number = ?, 
              address = ?, city = ?, state = ?, zip_code = ?
          WHERE id = ?
        `,
        args: [
          orderData.firstName,
          orderData.lastName,
          orderData.phoneNumber || null,
          orderData.address,
          orderData.city,
          orderData.state,
          orderData.zipCode,
          customerId
        ]
      });
    } else {
      // Create new customer
      const customerResult = await db.execute({
        sql: `
          INSERT INTO customers (
            first_name, last_name, email, phone_number,
            address, city, state, zip_code, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          orderData.firstName,
          orderData.lastName,
          orderData.email,
          orderData.phoneNumber || null,
          orderData.address,
          orderData.city,
          orderData.state,
          orderData.zipCode,
          getISTDatetime()
        ]
      });
      
      customerId = Number(customerResult.lastInsertRowid);
    }

    // Create the order with payment info
    const orderStatus = orderData.paymentStatus === 'completed' ? 'confirmed' : 'pending';

    const orderResult = await db.execute({
      sql: `
        INSERT INTO orders (
          customer_id, subtotal, coupon_code, coupon_discount, shipping, tax, total,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        customerId,
        orderData.subtotal,
        orderData.couponCode || null,
        orderData.couponDiscount || 0,
        orderData.shipping,
        orderData.tax,
        orderData.total,
        orderStatus,
        getISTDatetime()
      ]
    });

    const orderId = Number(orderResult.lastInsertRowid);

    // Create order items
    for (const item of orderData.cartItems) {
      await db.execute({
        sql: `
          INSERT INTO order_items (
            order_id, product_id, product_name, price, quantity, total
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.price * item.quantity
        ]
      });
    }

    // Record coupon usage if a coupon was applied
    if (orderData.couponCode && orderData.couponDiscount && orderData.couponDiscount > 0) {
      try {
        const coupon = await getCouponByCode(orderData.couponCode);
        if (coupon) {
          await recordCouponUsage(coupon.id, orderId, orderData.email, orderData.couponDiscount);
        }
      } catch (couponError) {
        console.error('Error recording coupon usage:', couponError);
        // Don't fail the order creation for coupon usage recording errors
      }
    }

    return { orderId, customerId };
  } catch (error) {
    console.error('Error creating order:', error);

    // If order creation failed after stock was deducted, restore the stock
    try {
      const stockItems = orderData.cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity
      }));
      await restoreStock(stockItems);
      console.log('Stock restored after order creation failure');
    } catch (restoreError) {
      console.error('Failed to restore stock after order creation failure:', restoreError);
    }

    throw error;
  }
}