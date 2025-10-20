// src/lib/discounts.ts
import { rawDb as db } from './db';

export interface Discount {
  id: number;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountApplication {
  isValid: boolean;
  discount?: Discount;
  discountAmount: number;
  message: string;
}

// Create discounts table if it doesn't exist
export async function initializeDiscountsTable() {
  try {
    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS discounts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          description TEXT NOT NULL,
          discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
          discount_value REAL NOT NULL,
          minimum_order_amount REAL NOT NULL DEFAULT 0,
          max_discount_amount REAL,
          is_active INTEGER NOT NULL DEFAULT 1,
          valid_from TEXT NOT NULL,
          valid_to TEXT NOT NULL,
          usage_limit INTEGER,
          used_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `
    });

    // Create discount_usage table to track individual discount uses
    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS discount_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          discount_id INTEGER NOT NULL,
          order_id INTEGER NOT NULL,
          customer_email TEXT NOT NULL,
          discount_amount REAL NOT NULL,
          used_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (discount_id) REFERENCES discounts(id)
        )
      `
    });

    // console.log('discounts tables initialized successfully');
  } catch (error) {
    console.error('Error initializing discounts tables:', error);
    throw error;
  }
}

// Get all discounts with optional filters
export async function getAllDiscounts(filters?: {
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ discounts: Discount[]; total: number }> {
  try {
    let sql = 'SELECT * FROM discounts WHERE 1=1';
    const args: any[] = [];

    if (filters?.isActive !== undefined) {
      sql += ' AND is_active = ?';
      args.push(filters.isActive ? 1 : 0);
    }

    if (filters?.search) {
      sql += ' AND (code LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      args.push(searchTerm, searchTerm);
    }

    // Get total count
    const countResult = await db.execute({
      sql: sql.replace('SELECT *', 'SELECT COUNT(*) as total'),
      args
    });
    const total = Number(countResult.rows[0]?.total || 0);

    // Add ordering and pagination
    sql += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      sql += ' LIMIT ?';
      args.push(filters.limit);

      if (filters?.offset) {
        sql += ' OFFSET ?';
        args.push(filters.offset);
      }
    }

    const result = await db.execute({ sql, args });

    const discounts = result.rows.map(row => ({
      id: Number(row.id),
      code: String(row.code),
      description: String(row.description),
      discountType: String(row.discount_type) as 'percentage' | 'fixed',
      discountValue: Number(row.discount_value),
      minimumOrderAmount: Number(row.minimum_order_amount),
      maxDiscountAmount: row.max_discount_amount ? Number(row.max_discount_amount) : undefined,
      isActive: Boolean(row.is_active),
      validFrom: String(row.valid_from),
      validTo: String(row.valid_to),
      usageLimit: row.usage_limit ? Number(row.usage_limit) : undefined,
      usedCount: Number(row.used_count),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    }));

    return { discounts, total };
  } catch (error) {
    console.error('Error fetching discounts:', error);
    throw error;
  }
}

// Get discount by ID
export async function getDiscountById(id: number): Promise<Discount | null> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM discounts WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: Number(row.id),
      code: String(row.code),
      description: String(row.description),
      discountType: String(row.discount_type) as 'percentage' | 'fixed',
      discountValue: Number(row.discount_value),
      minimumOrderAmount: Number(row.minimum_order_amount),
      maxDiscountAmount: row.max_discount_amount ? Number(row.max_discount_amount) : undefined,
      isActive: Boolean(row.is_active),
      validFrom: String(row.valid_from),
      validTo: String(row.valid_to),
      usageLimit: row.usage_limit ? Number(row.usage_limit) : undefined,
      usedCount: Number(row.used_count),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    };
  } catch (error) {
    console.error('Error fetching discount by ID:', error);
    throw error;
  }
}

// Get discount by code
export async function getDiscountByCode(code: string): Promise<Discount | null> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM discounts WHERE code = ? AND is_active = 1',
      args: [code.toUpperCase()]
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: Number(row.id),
      code: String(row.code),
      description: String(row.description),
      discountType: String(row.discount_type) as 'percentage' | 'fixed',
      discountValue: Number(row.discount_value),
      minimumOrderAmount: Number(row.minimum_order_amount),
      maxDiscountAmount: row.max_discount_amount ? Number(row.max_discount_amount) : undefined,
      isActive: Boolean(row.is_active),
      validFrom: String(row.valid_from),
      validTo: String(row.valid_to),
      usageLimit: row.usage_limit ? Number(row.usage_limit) : undefined,
      usedCount: Number(row.used_count),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    };
  } catch (error) {
    console.error('Error fetching discount by code:', error);
    throw error;
  }
}

// Validate and apply discount
export async function validateDiscount(code: string, orderAmount: number, customerEmail?: string): Promise<DiscountApplication> {
  try {
    const discount = await getDiscountByCode(code);

    if (!discount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Invalid discount code'
      };
    }

    // Check if discount is active
    if (!discount.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This discount is not active'
      };
    }

    // Check validity dates
    const now = new Date();
    const validFrom = new Date(discount.validFrom);
    const validTo = new Date(discount.validTo);

    if (now < validFrom) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This discount is not yet valid'
      };
    }

    if (now > validTo) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This discount has expired'
      };
    }

    // Check minimum order amount
    if (orderAmount < discount.minimumOrderAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Minimum order amount of ₹${discount.minimumOrderAmount} required`
      };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This discount has reached its usage limit'
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.discountType === 'percentage') {
      discountAmount = (orderAmount * discount.discountValue) / 100;

      // Apply max discount limit if specified
      if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
        discountAmount = discount.maxDiscountAmount;
      }
    } else {
      discountAmount = discount.discountValue;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      isValid: true,
      discount,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      message: `discount applied! You saved ₹${discountAmount.toFixed(2)}`
    };

  } catch (error) {
    console.error('Error validating discount:', error);
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Error validating discount'
    };
  }
}

// Create new discount
export async function createDiscount(discountData: {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount?: number;
  isActive?: boolean;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
}): Promise<Discount> {
  try {
    const result = await db.execute({
      sql: `
        INSERT INTO discounts (
          code, description, discount_type, discount_value,
          minimum_order_amount, max_discount_amount, is_active,
          valid_from, valid_to, usage_limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        discountData.code.toUpperCase(),
        discountData.description,
        discountData.discountType,
        discountData.discountValue,
        discountData.minimumOrderAmount,
        discountData.maxDiscountAmount || null,
        discountData.isActive !== false ? 1 : 0,
        discountData.validFrom,
        discountData.validTo,
        discountData.usageLimit || null
      ]
    });

    const id = Number(result.lastInsertRowid);
    const discount = await getDiscountById(id);
    if (!discount) {
      throw new Error('Failed to retrieve created discount');
    }
    return discount;
  } catch (error) {
    console.error('Error creating discount:', error);
    throw error;
  }
}

// Update discount
export async function updateDiscount(id: number, discountData: Partial<{
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount: number;
  maxDiscountAmount: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  usageLimit: number;
}>): Promise<Discount | null> {
  try {
    const updateFields = [];
    const args = [];

    if (discountData.code !== undefined) {
      updateFields.push('code = ?');
      args.push(discountData.code.toUpperCase());
    }
    if (discountData.description !== undefined) {
      updateFields.push('description = ?');
      args.push(discountData.description);
    }
    if (discountData.discountType !== undefined) {
      updateFields.push('discount_type = ?');
      args.push(discountData.discountType);
    }
    if (discountData.discountValue !== undefined) {
      updateFields.push('discount_value = ?');
      args.push(discountData.discountValue);
    }
    if (discountData.minimumOrderAmount !== undefined) {
      updateFields.push('minimum_order_amount = ?');
      args.push(discountData.minimumOrderAmount);
    }
    if (discountData.maxDiscountAmount !== undefined) {
      updateFields.push('max_discount_amount = ?');
      args.push(discountData.maxDiscountAmount);
    }
    if (discountData.isActive !== undefined) {
      updateFields.push('is_active = ?');
      args.push(discountData.isActive ? 1 : 0);
    }
    if (discountData.validFrom !== undefined) {
      updateFields.push('valid_from = ?');
      args.push(discountData.validFrom);
    }
    if (discountData.validTo !== undefined) {
      updateFields.push('valid_to = ?');
      args.push(discountData.validTo);
    }
    if (discountData.usageLimit !== undefined) {
      updateFields.push('usage_limit = ?');
      args.push(discountData.usageLimit);
    }

    if (updateFields.length === 0) {
      return null;
    }

    updateFields.push('updated_at = datetime("now")');
    args.push(id);

    const result = await db.execute({
      sql: `UPDATE discounts SET ${updateFields.join(', ')} WHERE id = ?`,
      args
    });

    if (result.rowsAffected === 0) {
      return null;
    }

    return await getDiscountById(id);
  } catch (error) {
    console.error('Error updating discount:', error);
    throw error;
  }
}

// Delete discount
export async function deleteDiscount(id: number): Promise<boolean> {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM discounts WHERE id = ?',
      args: [id]
    });

    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error deleting discount:', error);
    throw error;
  }
}

// Record discount usage
export async function recordDiscountUsage(discountId: number, orderId: number, customerEmail: string, discountAmount: number): Promise<void> {
  try {
    // Record usage
    await db.execute({
      sql: `
        INSERT INTO discount_usage (discount_id, order_id, customer_email, discount_amount)
        VALUES (?, ?, ?, ?)
      `,
      args: [discountId, orderId, customerEmail, discountAmount]
    });

    // Update used count
    await db.execute({
      sql: 'UPDATE discounts SET used_count = used_count + 1 WHERE id = ?',
      args: [discountId]
    });
  } catch (error) {
    console.error('Error recording discount usage:', error);
    throw error;
  }
}