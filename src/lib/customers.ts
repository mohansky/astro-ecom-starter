// src/lib/customers.ts
import { rawDb as db } from './db';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface CustomerDetail extends Omit<Customer, 'orderCount' | 'totalSpent'> {
  orders: {
    id: number;
    date: string;
    total: number;
    status: string;
  }[];
}

// Function to get all customers with basic summary info
export async function getAllCustomers(): Promise<Customer[]> {
  try {
    const result = await db.execute({
      sql: `
        SELECT
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone_number,
          c.address,
          c.city,
          c.state,
          c.zip_code,
          c.created_at,
          COUNT(o.id) as order_count,
          COALESCE(SUM(o.total), 0) as total_spent
        FROM
          customers c
        LEFT JOIN
          orders o ON c.id = o.customer_id
        GROUP BY
          c.id
        ORDER BY
          c.last_name, c.first_name
      `
    });

    return result.rows.map(row => ({
      id: Number(row.id),
      firstName: String(row.first_name),
      lastName: String(row.last_name),
      email: String(row.email),
      phoneNumber: String(row.phone_number || ''),
      address: String(row.address),
      city: String(row.city),
      state: String(row.state),
      zipCode: String(row.zip_code),
      createdAt: String(row.created_at),
      orderCount: Number(row.order_count),
      totalSpent: Number(row.total_spent)
    }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

// Function to get detailed customer information with their orders
export async function getCustomerById(customerId: number): Promise<CustomerDetail | null> {
  try {
    // Get customer information
    const customerResult = await db.execute({
      sql: `
        SELECT
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone_number,
          c.address,
          c.city,
          c.state,
          c.zip_code,
          c.created_at
        FROM
          customers c
        WHERE
          c.id = ?
      `,
      args: [customerId]
    });

    if (customerResult.rows.length === 0) {
      return null;
    }

    const customer = customerResult.rows[0];

    // Get customer's orders
    const ordersResult = await db.execute({
      sql: `
        SELECT
          id,
          created_at as date,
          total,
          status
        FROM
          orders
        WHERE
          customer_id = ?
        ORDER BY
          created_at DESC
      `,
      args: [customerId]
    });

    const orders = ordersResult.rows.map(order => ({
      id: Number(order.id),
      date: String(order.date),
      total: Number(order.total),
      status: String(order.status)
    }));

    return {
      id: Number(customer.id),
      firstName: String(customer.first_name),
      lastName: String(customer.last_name),
      email: String(customer.email),
      phoneNumber: String(customer.phone_number || ''),
      address: String(customer.address),
      city: String(customer.city),
      state: String(customer.state),
      zipCode: String(customer.zip_code),
      createdAt: String(customer.created_at),
      orders
    };
  } catch (error) {
    console.error(`Error fetching customer ${customerId}:`, error);
    throw error;
  }
}

// Function to create a new customer
export async function createCustomer(customerData: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}): Promise<number> {
  try {
    const result = await db.execute({
      sql: `
        INSERT INTO customers (
          first_name, last_name, email, phone_number, 
          address, city, state, zip_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `,
      args: [
        customerData.firstName,
        customerData.lastName,
        customerData.email,
        customerData.phoneNumber || null,
        customerData.address,
        customerData.city,
        customerData.state,
        customerData.zipCode
      ]
    });

    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

// Function to update customer information
export async function updateCustomer(
  customerId: number,
  customerData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }>
): Promise<boolean> {
  try {
    const updateFields = [];
    const args = [];

    if (customerData.firstName !== undefined) {
      updateFields.push('first_name = ?');
      args.push(customerData.firstName);
    }
    if (customerData.lastName !== undefined) {
      updateFields.push('last_name = ?');
      args.push(customerData.lastName);
    }
    if (customerData.email !== undefined) {
      updateFields.push('email = ?');
      args.push(customerData.email);
    }
    if (customerData.phoneNumber !== undefined) {
      updateFields.push('phone_number = ?');
      args.push(customerData.phoneNumber || null);
    }
    if (customerData.address !== undefined) {
      updateFields.push('address = ?');
      args.push(customerData.address);
    }
    if (customerData.city !== undefined) {
      updateFields.push('city = ?');
      args.push(customerData.city);
    }
    if (customerData.state !== undefined) {
      updateFields.push('state = ?');
      args.push(customerData.state);
    }
    if (customerData.zipCode !== undefined) {
      updateFields.push('zip_code = ?');
      args.push(customerData.zipCode);
    }

    if (updateFields.length === 0) {
      return false; // No fields to update
    }

    args.push(customerId);

    const result = await db.execute({
      sql: `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`,
      args
    });

    return result.rowsAffected > 0;
  } catch (error) {
    console.error(`Error updating customer ${customerId}:`, error);
    throw error;
  }
}