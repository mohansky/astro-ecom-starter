/**
 * Test cases for pricing utility functions
 * Run these manually to verify the logic works correctly
 */

import { getPriceInfo, calculateDiscountPercent, calculatePriceFromDiscount, validatePricing } from './pricing-utils';

// Test cases for discount calculation
const testCases = [
  {
    name: "Basic discount calculation",
    input: { price: 800, mrp: 1000 },
    expected: { discountPercent: 20, hasDiscount: true }
  },
  {
    name: "No discount when price equals MRP",
    input: { price: 1000, mrp: 1000 },
    expected: { discountPercent: 0, hasDiscount: false }
  },
  {
    name: "50% discount",
    input: { price: 500, mrp: 1000 },
    expected: { discountPercent: 50, hasDiscount: true }
  },
  {
    name: "Manual discount field used when no MRP difference",
    input: { price: 1000, mrp: 1000, discount: 25 },
    expected: { discountPercent: 25, hasDiscount: false } // No actual discount in price
  },
  {
    name: "Auto-calculated discount takes priority over manual",
    input: { price: 800, mrp: 1000, discount: 50 },
    expected: { discountPercent: 20, hasDiscount: true } // Uses calculated 20%, not manual 50%
  },
  {
    name: "Edge case: Price higher than MRP",
    input: { price: 1200, mrp: 1000 },
    expected: { discountPercent: 0, hasDiscount: false }
  }
];

// Run tests
console.log("🧪 Testing Pricing Utils...\n");

testCases.forEach((test, index) => {
  const result = getPriceInfo(test.input);
  const passed = result.discountPercent === test.expected.discountPercent &&
                 result.hasDiscount === test.expected.hasDiscount;

  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Input: ${JSON.stringify(test.input)}`);
  console.log(`   Expected: ${JSON.stringify(test.expected)}`);
  console.log(`   Got: { discountPercent: ${result.discountPercent}, hasDiscount: ${result.hasDiscount} }`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Test validation function
console.log("🔍 Testing Validation...\n");

const validationTests = [
  {
    name: "Valid pricing",
    input: { price: 800, mrp: 1000 },
    shouldBeValid: true
  },
  {
    name: "Price higher than MRP",
    input: { price: 1200, mrp: 1000 },
    shouldBeValid: false
  },
  {
    name: "Negative discount",
    input: { price: 800, mrp: 1000, discount: -10 },
    shouldBeValid: false
  },
  {
    name: "Discount over 100%",
    input: { price: 800, mrp: 1000, discount: 150 },
    shouldBeValid: false
  }
];

validationTests.forEach((test, index) => {
  const result = validatePricing(test.input);
  const passed = result.isValid === test.shouldBeValid;

  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Input: ${JSON.stringify(test.input)}`);
  console.log(`   Should be valid: ${test.shouldBeValid}`);
  console.log(`   Is valid: ${result.isValid}`);
  if (!result.isValid) {
    console.log(`   Errors: ${result.errors.join(', ')}`);
  }
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

export { testCases, validationTests };