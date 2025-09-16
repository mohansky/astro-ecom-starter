-- Add GST percentage and tax inclusion fields to products table
ALTER TABLE products ADD COLUMN gstPercentage REAL DEFAULT 5;
ALTER TABLE products ADD COLUMN taxInclusive INTEGER DEFAULT 0;

-- Update existing products to have default tax settings
UPDATE products
SET gstPercentage = 5, taxInclusive = 0
WHERE gstPercentage IS NULL OR taxInclusive IS NULL;