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

export interface DiscountsResponse {
  success: boolean;
  coupons: Discount[]; // API returns 'coupons' key for backward compatibility
  discounts?: Discount[]; // Optional property for transformed data in hooks
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}