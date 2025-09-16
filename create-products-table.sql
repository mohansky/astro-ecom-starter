-- Create products table for Turso database
-- Run this script in your Turso database console or via CLI

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    price REAL NOT NULL,
    mrp REAL NOT NULL,
    discount REAL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    weight REAL,
    dimensions TEXT,
    imagePath TEXT,
    tags TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    featured INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_isActive ON products(isActive);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_createdAt ON products(createdAt);

-- Insert some sample data (optional)
INSERT INTO products (
    id, name, description, category, subcategory, price, mrp, discount,
    stock, weight, imagePath, tags, isActive, featured, createdAt, updatedAt
) VALUES
(
    'bag-wood-handle-001',
    'Handcrafted Bag with Wood Handle',
    'Beautiful handcrafted bag featuring elegant wooden handles, perfect for daily use.',
    'Bags',
    'Handbags',
    899.00,
    1299.00,
    30.79,
    15,
    350.0,
    'bag-wood-handle',
    'bag,wood,handle,handcrafted,eco-friendly',
    1,
    1,
    datetime('now'),
    datetime('now')
),
(
    'basket-001',
    'Woven Storage Basket',
    'Traditional woven basket for storage and organization.',
    'Home Decor',
    'Storage',
    459.00,
    599.00,
    23.37,
    25,
    200.0,
    'basket',
    'basket,storage,woven,traditional',
    1,
    0,
    datetime('now'),
    datetime('now')
),
(
    'yoga-mat-holder-001',
    'Yoga Mat Holder Belt',
    'Convenient yoga mat holder belt for easy transport and storage.',
    'Fitness',
    'Yoga Accessories',
    299.00,
    399.00,
    25.06,
    30,
    100.0,
    'yoga-mat-holder-01-yoga-mat-belt',
    'yoga,mat,holder,belt,fitness,transport',
    1,
    0,
    datetime('now'),
    datetime('now')
);