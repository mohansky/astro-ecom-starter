// src/lib/coupons.ts
import { rawDb as db } from './db';

export interface Coupon {
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

export interface CouponApplication {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}

// Create coupons table if it doesn't exist
export async function initializeCouponsTable() {
  try {
    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS coupons (
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

    // Create coupon_usage table to track individual coupon uses
    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS coupon_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          coupon_id INTEGER NOT NULL,
          order_id INTEGER NOT NULL,
          customer_email TEXT NOT NULL,
          discount_amount REAL NOT NULL,
          used_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (coupon_id) REFERENCES coupons(id)
        )
      `
    });

    // console.log('Coupons tables initialized successfully');
  } catch (error) {
    console.error('Error initializing coupons tables:', error);
    throw error;
  }
}

// Get all coupons with optional filters
export async function getAllCoupons(filters?: {
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ coupons: Coupon[]; total: number }> {
  try {
    let sql = 'SELECT * FROM coupons WHERE 1=1';
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

    const coupons = result.rows.map(row => ({
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

    return { coupons, total };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
}

// Get coupon by code
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM coupons WHERE code = ? AND is_active = 1',
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
    console.error('Error fetching coupon by code:', error);
    throw error;
  }
}

// Validate and apply coupon
export async function validateCoupon(code: string, orderAmount: number, customerEmail?: string): Promise<CouponApplication> {
  try {
    const coupon = await getCouponByCode(code);

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Invalid coupon code'
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This coupon is not active'
      };
    }

    // Check validity dates
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = new Date(coupon.validTo);

    if (now < validFrom) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This coupon is not yet valid'
      };
    }

    if (now > validTo) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This coupon has expired'
      };
    }

    // Check minimum order amount
    if (orderAmount < coupon.minimumOrderAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Minimum order amount of ₹${coupon.minimumOrderAmount} required`
      };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'This coupon has reached its usage limit'
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;

      // Apply max discount limit if specified
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    return {
      isValid: true,
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      message: `Coupon applied! You saved ₹${discountAmount.toFixed(2)}`
    };

  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Error validating coupon'
    };
  }
}

// Create new coupon
export async function createCoupon(couponData: {
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
}): Promise<number> {
  try {
    const result = await db.execute({
      sql: `
        INSERT INTO coupons (
          code, description, discount_type, discount_value,
          minimum_order_amount, max_discount_amount, is_active,
          valid_from, valid_to, usage_limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        couponData.code.toUpperCase(),
        couponData.description,
        couponData.discountType,
        couponData.discountValue,
        couponData.minimumOrderAmount,
        couponData.maxDiscountAmount || null,
        couponData.isActive !== false ? 1 : 0,
        couponData.validFrom,
        couponData.validTo,
        couponData.usageLimit || null
      ]
    });

    return Number(result.lastInsertRowid);
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

// Update coupon
export async function updateCoupon(id: number, couponData: Partial<{
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
}>): Promise<boolean> {
  try {
    const updateFields = [];
    const args = [];

    if (couponData.code !== undefined) {
      updateFields.push('code = ?');
      args.push(couponData.code.toUpperCase());
    }
    if (couponData.description !== undefined) {
      updateFields.push('description = ?');
      args.push(couponData.description);
    }
    if (couponData.discountType !== undefined) {
      updateFields.push('discount_type = ?');
      args.push(couponData.discountType);
    }
    if (couponData.discountValue !== undefined) {
      updateFields.push('discount_value = ?');
      args.push(couponData.discountValue);
    }
    if (couponData.minimumOrderAmount !== undefined) {
      updateFields.push('minimum_order_amount = ?');
      args.push(couponData.minimumOrderAmount);
    }
    if (couponData.maxDiscountAmount !== undefined) {
      updateFields.push('max_discount_amount = ?');
      args.push(couponData.maxDiscountAmount);
    }
    if (couponData.isActive !== undefined) {
      updateFields.push('is_active = ?');
      args.push(couponData.isActive ? 1 : 0);
    }
    if (couponData.validFrom !== undefined) {
      updateFields.push('valid_from = ?');
      args.push(couponData.validFrom);
    }
    if (couponData.validTo !== undefined) {
      updateFields.push('valid_to = ?');
      args.push(couponData.validTo);
    }
    if (couponData.usageLimit !== undefined) {
      updateFields.push('usage_limit = ?');
      args.push(couponData.usageLimit);
    }

    if (updateFields.length === 0) {
      return false;
    }

    updateFields.push('updated_at = datetime("now")');
    args.push(id);

    const result = await db.execute({
      sql: `UPDATE coupons SET ${updateFields.join(', ')} WHERE id = ?`,
      args
    });

    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
}

// Delete coupon
export async function deleteCoupon(id: number): Promise<boolean> {
  try {
    const result = await db.execute({
      sql: 'DELETE FROM coupons WHERE id = ?',
      args: [id]
    });

    return result.rowsAffected > 0;
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
}

// Record coupon usage
export async function recordCouponUsage(couponId: number, orderId: number, customerEmail: string, discountAmount: number): Promise<void> {
  try {
    // Record usage
    await db.execute({
      sql: `
        INSERT INTO coupon_usage (coupon_id, order_id, customer_email, discount_amount)
        VALUES (?, ?, ?, ?)
      `,
      args: [couponId, orderId, customerEmail, discountAmount]
    });

    // Update used count
    await db.execute({
      sql: 'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
      args: [couponId]
    });
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    throw error;
  }
}