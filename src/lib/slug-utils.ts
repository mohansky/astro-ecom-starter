/**
 * Generate a URL-friendly slug from a product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate SKU from product name, category, and ID
 * Format: AABB-CCCCCC (first 2 of name + first 2 of category - first 6 of ID)
 */
export function generateSKU(name: string, category: string, productId: string): string {
  // Get first 2 letters of product name (remove spaces and special chars)
  const namePrefix = name
    .replace(/[^a-zA-Z]/g, '') // Keep only letters
    .toUpperCase()
    .slice(0, 2)
    .padEnd(2, 'X'); // Pad with X if less than 2 letters

  // Get first 2 letters of category (remove spaces and special chars)
  const categoryPrefix = category
    .replace(/[^a-zA-Z]/g, '') // Keep only letters
    .toUpperCase()
    .slice(0, 2)
    .padEnd(2, 'X'); // Pad with X if less than 2 letters

  // Get first 6 characters of product ID
  const idSuffix = productId.slice(0, 6).toUpperCase();

  // Format: AABB-CCCCCC
  return `${namePrefix}${categoryPrefix}-${idSuffix}`;
}
