// src/lib/db.ts
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Raw Turso client for your existing functions
export const rawDb = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

// Drizzle instance for Better Auth
const authClient = createClient({
  url: import.meta.env.TURSO_DATABASE_URL,
  authToken: import.meta.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(authClient, { schema });

// Helper function to get IST datetime string
function getISTDatetime(): string {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
  return istTime.toISOString().replace('T', ' ').replace('Z', '').substring(0, 19);
}

// Database migration for tax fields
export async function migrateTaxFields() {
  try {
    // Add gstPercentage column
    await rawDb.execute({
      sql: `ALTER TABLE products ADD COLUMN gstPercentage REAL DEFAULT 5`
    }).catch(() => {}); // Ignore error if column already exists

    // Add taxInclusive column
    await rawDb.execute({
      sql: `ALTER TABLE products ADD COLUMN taxInclusive INTEGER DEFAULT 0`
    }).catch(() => {}); // Ignore error if column already exists

    // Update existing products to have default values
    await rawDb.execute({
      sql: `UPDATE products SET gstPercentage = 5 WHERE gstPercentage IS NULL`
    });

    await rawDb.execute({
      sql: `UPDATE products SET taxInclusive = 0 WHERE taxInclusive IS NULL`
    });

    console.log('Tax fields migration completed successfully');
  } catch (error) {
    console.error('Error migrating tax fields:', error);
  }
}

// Keep all your existing functions but update them to use rawDb
export interface Admin {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export async function getAdminByUsername(username: string): Promise<Admin | null> {
  try {
    const result = await rawDb.execute({
      sql: 'SELECT * FROM admins WHERE username = ?',
      args: [username]
    });
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      id: row.id as number,
      username: row.username as string,
      password: row.password as string,
      created_at: row.created_at as string,
    };
  } catch (error) {
    console.error('Error fetching admin:', error);
    return null;
  }
}

export async function logAdminAction(adminId: number, action: string, ipAddress?: string) {
  try {
    await rawDb.execute({
      sql: 'INSERT INTO admin_logs (admin_id, action, ip_address) VALUES (?, ?, ?)',
      args: [adminId, action, ipAddress || null]
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function createAdmin(username: string, hashedPassword: string) {
  try {
    const result = await rawDb.execute({
      sql: 'INSERT INTO admins (username, password) VALUES (?, ?)',
      args: [username, hashedPassword]
    });
    
    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

export async function createCustomer(customerData: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address: string;
  city: string;
  zipCode: string;
  state: string;
}) {
  try {
    const existingCustomer = await rawDb.execute({
      sql: 'SELECT * FROM customers WHERE email = ?',
      args: [customerData.email]
    });

    let customerId: number;

    if (existingCustomer.rows.length > 0) {
      customerId = Number(existingCustomer.rows[0].id);
     
      await rawDb.execute({
        sql: `
          UPDATE customers
          SET first_name = ?, last_name = ?, phone_number = ?, address = ?, city = ?, zip_code = ?, state = ?
          WHERE id = ?
        `,
        args: [
          customerData.firstName,
          customerData.lastName,
          customerData.phoneNumber || null,
          customerData.address,
          customerData.city,
          customerData.zipCode,
          customerData.state,
          customerId
        ]
      });
    } else {
      const result = await rawDb.execute({
        sql: `
          INSERT INTO customers (first_name, last_name, email, phone_number, address, city, zip_code, state, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          customerData.firstName,
          customerData.lastName,
          customerData.email,
          customerData.phoneNumber || null,
          customerData.address,
          customerData.city,
          customerData.zipCode,
          customerData.state,
          getISTDatetime()
        ]
      });
     
      customerId = Number(result.lastInsertRowid);
    }
   
    return customerId;
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    throw error;
  }
}

export async function createOrder(orderData: {
  customerId: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}) {
  try {
    const orderResult = await rawDb.execute({
      sql: `
        INSERT INTO orders (customer_id, subtotal, shipping, tax, total, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        orderData.customerId,
        orderData.subtotal,
        orderData.shipping,
        orderData.tax,
        orderData.total,
        'pending',
        getISTDatetime()
      ]
    });
   
    const orderId = Number(orderResult.lastInsertRowid);
   
    for (const item of orderData.items) {
      await rawDb.execute({
        sql: `
          INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total)
          VALUES (?, ?, ?, ?, ?, ?)
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
   
    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function getAllCustomers() {
  try {
    const result = await rawDb.execute({
      sql: 'SELECT * FROM customers ORDER BY created_at DESC'
    });
    return result.rows;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

export async function getAllOrders() {
  try {
    const result = await rawDb.execute({
      sql: `
        SELECT o.*, c.first_name, c.last_name, c.email 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.created_at DESC
      `
    });
    return result.rows;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export async function getOrderById(orderId: number) {
  try {
    const orderResult = await rawDb.execute({
      sql: `
        SELECT o.*, c.first_name, c.last_name, c.email, c.phone_number, c.address, c.city, c.state, c.zip_code
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        WHERE o.id = ?
      `,
      args: [orderId]
    });

    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];

    const itemsResult = await rawDb.execute({
      sql: 'SELECT * FROM order_items WHERE order_id = ?',
      args: [orderId]
    });

    return {
      ...order,
      items: itemsResult.rows
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    await rawDb.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ?',
      args: [status, orderId]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

// Product Management Functions
export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  weight?: number;
  dimensions?: string;
  imagePath?: string;
  tags?: string;
  gstPercentage: number;
  taxInclusive: boolean;
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const productId = crypto.randomUUID();
    const now = getISTDatetime();

    const result = await rawDb.execute({
      sql: `
        INSERT INTO products (
          id, name, description, category, subcategory, price, mrp, discount,
          stock, weight, dimensions, imagePath, tags, gstPercentage, taxInclusive,
          isActive, featured, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        productId,
        productData.name,
        productData.description || null,
        productData.category,
        productData.subcategory || null,
        productData.price,
        productData.mrp,
        productData.discount || 0,
        productData.stock || 0,
        productData.weight || null,
        productData.dimensions || null,
        productData.imagePath || null,
        productData.tags || null,
        productData.gstPercentage || 5,
        productData.taxInclusive ? 1 : 0,
        productData.isActive ? 1 : 0,
        productData.featured ? 1 : 0,
        now,
        now
      ]
    });

    return productId;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const now = getISTDatetime();

    const updates = Object.entries(productData).filter(([_, value]) => value !== undefined);
    const setClause = updates.map(([key]) => `${key} = ?`).join(', ');
    const values = updates.map(([_, value]) => value);

    await rawDb.execute({
      sql: `UPDATE products SET ${setClause}, updatedAt = ? WHERE id = ?`,
      args: [...values, now, productId]
    });

    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  try {
    await rawDb.execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [productId]
    });
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const result = await rawDb.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [productId]
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string || undefined,
      category: row.category as string,
      subcategory: row.subcategory as string || undefined,
      price: row.price as number,
      mrp: row.mrp as number,
      discount: row.discount as number || 0,
      stock: row.stock as number,
      weight: row.weight as number || undefined,
      dimensions: row.dimensions as string || undefined,
      imagePath: row.imagePath as string || undefined,
      tags: row.tags as string || undefined,
      gstPercentage: row.gstPercentage as number || 5,
      taxInclusive: Boolean(row.taxInclusive),
      isActive: Boolean(row.isActive),
      featured: Boolean(row.featured),
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getAllProducts(options: {
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
  isActive?: boolean;
} = {}) {
  try {
    const { search, category, limit = 50, offset = 0, isActive } = options;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const args: any[] = [];

    if (isActive !== undefined) {
      sql += ' AND isActive = ?';
      args.push(isActive ? 1 : 0);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${search}%`;
      args.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      sql += ' AND category = ?';
      args.push(category);
    }

    // Count total for pagination
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await rawDb.execute({ sql: countSql, args });
    const total = countResult.rows[0].count as number;

    // Add pagination
    sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const result = await rawDb.execute({ sql, args });

    const products = result.rows.map(row => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string || undefined,
      category: row.category as string,
      subcategory: row.subcategory as string || undefined,
      price: row.price as number,
      mrp: row.mrp as number,
      discount: row.discount as number || 0,
      stock: row.stock as number,
      weight: row.weight as number || undefined,
      dimensions: row.dimensions as string || undefined,
      imagePath: row.imagePath as string || undefined,
      tags: row.tags as string || undefined,
      gstPercentage: row.gstPercentage as number || 5,
      taxInclusive: Boolean(row.taxInclusive),
      isActive: Boolean(row.isActive),
      featured: Boolean(row.featured),
      createdAt: row.createdAt as string,
      updatedAt: row.updatedAt as string,
    }));

    // Get unique categories
    const categoriesResult = await rawDb.execute({
      sql: 'SELECT DISTINCT category FROM products WHERE isActive = 1 ORDER BY category'
    });
    const categories = categoriesResult.rows.map(row => row.category as string);

    return {
      products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      categories
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function bulkCreateProducts(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) {
  try {
    const now = getISTDatetime();

    for (const productData of products) {
      const productId = crypto.randomUUID();

      await rawDb.execute({
        sql: `
          INSERT INTO products (
            id, name, description, category, subcategory, price, mrp, discount,
            stock, weight, dimensions, imagePath, tags, gstPercentage, taxInclusive,
            isActive, featured, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          productId,
          productData.name,
          productData.description || null,
          productData.category,
          productData.subcategory || null,
          productData.price,
          productData.mrp,
          productData.discount || 0,
          productData.stock || 0,
          productData.weight || null,
          productData.dimensions || null,
          productData.imagePath || null,
          productData.tags || null,
          productData.gstPercentage || 5,
          productData.taxInclusive ? 1 : 0,
          productData.isActive ? 1 : 0,
          productData.featured ? 1 : 0,
          now,
          now
        ]
      });
    }

    return true;
  } catch (error) {
    console.error('Error bulk creating products:', error);
    throw error;
  }
}

// Stock Management Functions
export async function updateProductStock(productId: string, newStock: number) {
  try {
    const now = getISTDatetime();

    await rawDb.execute({
      sql: `
        UPDATE products
        SET stock = ?, updatedAt = ?
        WHERE id = ?
      `,
      args: [newStock, now, productId]
    });

    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

export async function decreaseProductStock(productId: string, quantity: number) {
  try {
    const now = getISTDatetime();

    const result = await rawDb.execute({
      sql: `
        UPDATE products
        SET stock = stock - ?, updatedAt = ?
        WHERE id = ? AND stock >= ?
      `,
      args: [quantity, now, productId, quantity]
    });

    // Check if the update was successful (affected rows > 0)
    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error decreasing product stock:', error);
    throw error;
  }
}

export async function increaseProductStock(productId: string, quantity: number) {
  try {
    const now = getISTDatetime();

    await rawDb.execute({
      sql: `
        UPDATE products
        SET stock = stock + ?, updatedAt = ?
        WHERE id = ?
      `,
      args: [quantity, now, productId]
    });

    return true;
  } catch (error) {
    console.error('Error increasing product stock:', error);
    throw error;
  }
}

export async function checkProductStock(productId: string): Promise<number | null> {
  try {
    const result = await rawDb.execute({
      sql: 'SELECT stock FROM products WHERE id = ? AND isActive = 1',
      args: [productId]
    });

    if (result.rows.length === 0) return null;

    return result.rows[0].stock as number;
  } catch (error) {
    console.error('Error checking product stock:', error);
    throw error;
  }
}

export async function validateCartStock(cartItems: Array<{ id: string; quantity: number }>): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    for (const item of cartItems) {
      const currentStock = await checkProductStock(item.id);

      if (currentStock === null) {
        errors.push(`Product ${item.id} not found or inactive`);
      } else if (currentStock < item.quantity) {
        errors.push(`Insufficient stock for product ${item.id}. Available: ${currentStock}, Requested: ${item.quantity}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('Error validating cart stock:', error);
    throw error;
  }
}

export async function processStockDeduction(cartItems: Array<{ id: string; quantity: number }>): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // First validate all items have sufficient stock
    const validation = await validateCartStock(cartItems);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Then decrease stock for each item
    for (const item of cartItems) {
      const success = await decreaseProductStock(item.id, item.quantity);
      if (!success) {
        errors.push(`Failed to update stock for product ${item.id}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('Error processing stock deduction:', error);
    throw error;
  }
}

export async function restoreStock(cartItems: Array<{ id: string; quantity: number }>): Promise<boolean> {
  try {
    for (const item of cartItems) {
      await increaseProductStock(item.id, item.quantity);
    }
    return true;
  } catch (error) {
    console.error('Error restoring stock:', error);
    throw error;
  }
}


// // src/lib/db.ts
// import { createClient } from '@libsql/client';
// // import * as schema from './schema';
// // // export const db = drizzle(client, { schema });

// // Create Turso client with your database URL and auth token
// export const db = createClient({
//   url: import.meta.env.TURSO_DATABASE_URL,
//   authToken: import.meta.env.TURSO_AUTH_TOKEN,
// });

// // Admin interface
// export interface Admin {
//   id: number;
//   username: string;
//   password: string;
//   created_at: string;
// }

// // Admin authentication functions
// export async function getAdminByUsername(username: string): Promise<Admin | null> {
//   try {
//     const result = await db.execute({
//       sql: 'SELECT * FROM admins WHERE username = ?',
//       args: [username]
//     });
    
//     if (result.rows.length === 0) return null;
    
//     const row = result.rows[0];
//     return {
//       id: row.id as number,
//       username: row.username as string,
//       password: row.password as string,
//       created_at: row.created_at as string,
//     };
//   } catch (error) {
//     console.error('Error fetching admin:', error);
//     return null;
//   }
// }

// export async function logAdminAction(adminId: number, action: string, ipAddress?: string) {
//   try {
//     await db.execute({
//       sql: 'INSERT INTO admin_logs (admin_id, action, ip_address) VALUES (?, ?, ?)',
//       args: [adminId, action, ipAddress || null]
//     });
//   } catch (error) {
//     console.error('Error logging admin action:', error);
//   }
// }

// export async function createAdmin(username: string, hashedPassword: string) {
//   try {
//     const result = await db.execute({
//       sql: 'INSERT INTO admins (username, password) VALUES (?, ?)',
//       args: [username, hashedPassword]
//     });
    
//     return Number(result.lastInsertRowid);
//   } catch (error) {
//     console.error('Error creating admin:', error);
//     throw error;
//   }
// }

// // Your existing customer functions
// export async function createCustomer(customerData: {
//   firstName: string;
//   lastName: string;
//   email: string;
//   phoneNumber?: string;
//   address: string;
//   city: string;
//   zipCode: string;
//   state: string;
// }) {
//   try {
//     // Check if customer already exists (using email as unique identifier)
//     const existingCustomer = await db.execute({
//       sql: 'SELECT * FROM customers WHERE email = ?',
//       args: [customerData.email]
//     });

//     let customerId: number;

//     if (existingCustomer.rows.length > 0) {
//       // Update existing customer
//       customerId = Number(existingCustomer.rows[0].id);
     
//       await db.execute({
//         sql: `
//           UPDATE customers
//           SET first_name = ?, last_name = ?, phone_number = ?, address = ?, city = ?, zip_code = ?, state = ?
//           WHERE id = ?
//         `,
//         args: [
//           customerData.firstName,
//           customerData.lastName,
//           customerData.phoneNumber || null,
//           customerData.address,
//           customerData.city,
//           customerData.zipCode,
//           customerData.state,
//           customerId
//         ]
//       });
//     } else {
//       // Create new customer
//       const result = await db.execute({
//         sql: `
//           INSERT INTO customers (first_name, last_name, email, phone_number, address, city, zip_code, state, created_at)
//           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
//         `,
//         args: [
//           customerData.firstName,
//           customerData.lastName,
//           customerData.email,
//           customerData.phoneNumber || null,
//           customerData.address,
//           customerData.city,
//           customerData.zipCode,
//           customerData.state
//         ]
//       });
     
//       customerId = Number(result.lastInsertRowid);
//     }
   
//     return customerId;
//   } catch (error) {
//     console.error('Error creating/updating customer:', error);
//     throw error;
//   }
// }

// // Your existing order function
// export async function createOrder(orderData: {
//   customerId: number;
//   items: Array<{
//     id: string;
//     name: string;
//     price: number;
//     quantity: number;
//   }>;
//   subtotal: number;
//   shipping: number;
//   tax: number;
//   total: number;
// }) {
//   try {
//     // Create the order
//     const orderResult = await db.execute({
//       sql: `
//         INSERT INTO orders (customer_id, subtotal, shipping, tax, total, status, created_at)
//         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
//       `,
//       args: [
//         orderData.customerId,
//         orderData.subtotal,
//         orderData.shipping,
//         orderData.tax,
//         orderData.total,
//         'pending' // Initial status
//       ]
//     });
   
//     const orderId = Number(orderResult.lastInsertRowid);
   
//     // Store order items
//     for (const item of orderData.items) {
//       await db.execute({
//         sql: `
//           INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total)
//           VALUES (?, ?, ?, ?, ?, ?)
//         `,
//         args: [
//           orderId,
//           item.id,
//           item.name,
//           item.price,
//           item.quantity,
//           item.price * item.quantity
//         ]
//       });
//     }
   
//     return orderId;
//   } catch (error) {
//     console.error('Error creating order:', error);
//     throw error;
//   }
// }

// // Additional utility functions for admin management
// export async function getAllCustomers() {
//   try {
//     const result = await db.execute({
//       sql: 'SELECT * FROM customers ORDER BY created_at DESC'
//     });
//     return result.rows;
//   } catch (error) {
//     console.error('Error fetching customers:', error);
//     throw error;
//   }
// }

// export async function getAllOrders() {
//   try {
//     const result = await db.execute({
//       sql: `
//         SELECT o.*, c.first_name, c.last_name, c.email 
//         FROM orders o 
//         JOIN customers c ON o.customer_id = c.id 
//         ORDER BY o.created_at DESC
//       `
//     });
//     return result.rows;
//   } catch (error) {
//     console.error('Error fetching orders:', error);
//     throw error;
//   }
// }

// export async function getOrderById(orderId: number) {
//   try {
//     const orderResult = await db.execute({
//       sql: `
//         SELECT o.*, c.first_name, c.last_name, c.email, c.phone_number, c.address, c.city, c.state, c.zip_code
//         FROM orders o 
//         JOIN customers c ON o.customer_id = c.id 
//         WHERE o.id = ?
//       `,
//       args: [orderId]
//     });

//     if (orderResult.rows.length === 0) return null;

//     const order = orderResult.rows[0];

//     // Get order items
//     const itemsResult = await db.execute({
//       sql: 'SELECT * FROM order_items WHERE order_id = ?',
//       args: [orderId]
//     });

//     return {
//       ...order,
//       items: itemsResult.rows
//     };
//   } catch (error) {
//     console.error('Error fetching order:', error);
//     throw error;
//   }
// }

// export async function updateOrderStatus(orderId: number, status: string) {
//   try {
//     await db.execute({
//       sql: 'UPDATE orders SET status = ? WHERE id = ?',
//       args: [status, orderId]
//     });
//   } catch (error) {
//     console.error('Error updating order status:', error);
//     throw error;
//   }
// }