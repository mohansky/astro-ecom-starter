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

export interface CouponsResponse {
  success: boolean;
  coupons: Coupon[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: string;
}