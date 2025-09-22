/**
 * Utility functions for pricing calculations
 */

export interface PriceInfo {
  finalPrice: number;
  originalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
  savings: number;
}

/**
 * Calculate discount percentage between original and current price
 */
export function calculateDiscountPercent(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= 0 || currentPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Calculate final price from MRP and discount percentage
 */
export function calculatePriceFromDiscount(mrp: number, discountPercent: number): number {
  if (mrp <= 0 || discountPercent <= 0) return mrp;
  return Math.round(mrp - (mrp * (discountPercent / 100)));
}

/**
 * Get comprehensive price information for a product
 */
export function getPriceInfo(params: {
  price?: number;
  mrp?: number;
  discount?: number;
  total?: number;
}): PriceInfo {
  const { price, mrp, discount, total } = params;

  // Determine final price (priority: price > total > mrp)
  const finalPrice = price !== undefined ? price : total !== undefined ? total : mrp || 0;
  const originalPrice = mrp || finalPrice;

  // Calculate actual discount from price difference
  const calculatedDiscount = calculateDiscountPercent(originalPrice, finalPrice);

  // Use calculated discount if available, otherwise fall back to manual discount
  const discountPercent = calculatedDiscount > 0 ? calculatedDiscount : (discount || 0);

  const hasDiscount = discountPercent > 0 && originalPrice > finalPrice;
  const savings = hasDiscount ? originalPrice - finalPrice : 0;

  return {
    finalPrice,
    originalPrice,
    discountPercent,
    hasDiscount,
    savings
  };
}

/**
 * Format currency amount to Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

/**
 * Validate price consistency
 */
export function validatePricing(params: {
  price?: number;
  mrp?: number;
  discount?: number;
}): { isValid: boolean; errors: string[] } {
  const { price, mrp, discount } = params;
  const errors: string[] = [];

  if (mrp && mrp <= 0) {
    errors.push("MRP must be greater than 0");
  }

  if (price && price <= 0) {
    errors.push("Price must be greater than 0");
  }

  if (mrp && price && price > mrp) {
    errors.push("Price cannot be greater than MRP");
  }

  if (discount && (discount < 0 || discount > 100)) {
    errors.push("Discount must be between 0 and 100");
  }

  if (mrp && price && discount) {
    const calculatedPrice = calculatePriceFromDiscount(mrp, discount);
    const priceDifference = Math.abs(price - calculatedPrice);
    if (priceDifference > 1) { // Allow ₹1 tolerance for rounding
      errors.push(`Price (₹${price}) doesn't match MRP (₹${mrp}) with ${discount}% discount (expected ₹${calculatedPrice})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}