// src/pages/api/products/index.ts
import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp: number;
  discount: number;
  weight: number;
  imagePath: string;
  slug: string;
  category: string;
  subcategory: string;
  stock: number;
  isActive: boolean;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Read and parse the CSV file
    const csvPath = path.join(process.cwd(), 'src', 'content', 'products', 'manubal-product-listing.csv');

    if (!fs.existsSync(csvPath)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Products data file not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Convert and filter products
    let products: Product[] = records.map((record: any) => {
      const mrp = parseFloat(record.mrp || 0);
      const totalPrice = parseFloat(record.total || 0);
      const price = totalPrice || mrp; // Use total if available, otherwise mrp
      const discount = mrp > 0 && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

      return {
        id: record.id || '',
        name: record.name || '',
        description: record.description || '',
        price: price,
        mrp: mrp,
        discount: discount,
        weight: parseFloat(record.weight || 0),
        imagePath: record.slug || record.images || '',
        slug: record.slug || '',
        category: record.category || '',
        subcategory: record.material || '',
        stock: parseInt(record.quantity || 0),
        isActive: (record.published || 'true').toLowerCase() === 'true'
      };
    });

    // Apply filters
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.subcategory.toLowerCase().includes(searchLower)
      );
    }

    if (category.trim()) {
      products = products.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    const total = products.length;

    // Apply pagination
    const paginatedProducts = products.slice(offset, offset + limit);

    // Get unique categories for filtering
    const categories = [...new Set(records.map((record: any) =>
      record.category
    ))].filter(Boolean);

    return new Response(JSON.stringify({
      success: true,
      products: paginatedProducts,
      categories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch products'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};