import type { APIRoute } from 'astro';
import { bulkCreateProducts } from '@/lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const csvFile = formData.get('csv') as File;

    if (!csvFile || csvFile.type !== 'text/csv') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Valid CSV file is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const csvText = await csvFile.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CSV must contain header row and at least one data row'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Required fields mapping
    const requiredFields = {
      name: ['name', 'product_name', 'title'],
      category: ['category', 'product_category'],
      price: ['price', 'selling_price'],
      mrp: ['mrp', 'original_price', 'list_price']
    };

    // Find column indices for required fields
    const fieldMapping: Record<string, number> = {};
    for (const [field, possibleNames] of Object.entries(requiredFields)) {
      const index = headers.findIndex(h =>
        possibleNames.some(name => h.toLowerCase().includes(name.toLowerCase()))
      );
      if (index === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: `Required field '${field}' not found in CSV headers. Expected one of: ${possibleNames.join(', ')}`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      fieldMapping[field] = index;
    }

    // Optional fields mapping
    const optionalFields = {
      description: ['description', 'product_description'],
      subcategory: ['subcategory', 'sub_category'],
      stock: ['stock', 'quantity', 'inventory'],
      weight: ['weight', 'weight_grams'],
      dimensions: ['dimensions', 'size'],
      tags: ['tags', 'keywords'],
      isActive: ['active', 'is_active', 'status'],
      featured: ['featured', 'is_featured'],
      gstPercentage: ['gstPercentage', 'gst_percentage', 'gst', 'tax_percentage'],
      taxInclusive: ['taxInclusive', 'tax_inclusive', 'price_includes_tax']
    };

    for (const [field, possibleNames] of Object.entries(optionalFields)) {
      const index = headers.findIndex(h =>
        possibleNames.some(name => h.toLowerCase().includes(name.toLowerCase()))
      );
      if (index !== -1) {
        fieldMapping[field] = index;
      }
    }

    // Parse data rows
    const products = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

        if (values.length < headers.length) {
          errors.push(`Row ${i + 1}: Insufficient columns`);
          continue;
        }

        const product: any = {
          name: values[fieldMapping.name],
          category: values[fieldMapping.category],
          price: parseFloat(values[fieldMapping.price]),
          mrp: parseFloat(values[fieldMapping.mrp]),
          gstPercentage: 5, // Default GST
          taxInclusive: false, // Default tax inclusive
          isActive: true,
          featured: false
        };

        // Validate required fields
        if (!product.name || !product.category || isNaN(product.price) || isNaN(product.mrp)) {
          errors.push(`Row ${i + 1}: Missing or invalid required fields`);
          continue;
        }

        // Add optional fields
        if (fieldMapping.description !== undefined) {
          product.description = values[fieldMapping.description] || undefined;
        }
        if (fieldMapping.subcategory !== undefined) {
          product.subcategory = values[fieldMapping.subcategory] || undefined;
        }
        if (fieldMapping.stock !== undefined) {
          const stock = parseInt(values[fieldMapping.stock]);
          product.stock = isNaN(stock) ? 0 : stock;
        }
        if (fieldMapping.weight !== undefined) {
          const weight = parseFloat(values[fieldMapping.weight]);
          product.weight = isNaN(weight) ? undefined : weight;
        }
        if (fieldMapping.dimensions !== undefined) {
          product.dimensions = values[fieldMapping.dimensions] || undefined;
        }
        if (fieldMapping.tags !== undefined) {
          product.tags = values[fieldMapping.tags] || undefined;
        }
        if (fieldMapping.isActive !== undefined) {
          const activeValue = values[fieldMapping.isActive].toLowerCase();
          product.isActive = activeValue === 'true' || activeValue === '1' || activeValue === 'active';
        }
        if (fieldMapping.featured !== undefined) {
          const featuredValue = values[fieldMapping.featured].toLowerCase();
          product.featured = featuredValue === 'true' || featuredValue === '1' || featuredValue === 'yes';
        }
        if (fieldMapping.gstPercentage !== undefined) {
          const gst = parseFloat(values[fieldMapping.gstPercentage]);
          product.gstPercentage = isNaN(gst) ? 5 : gst;
        }
        if (fieldMapping.taxInclusive !== undefined) {
          const taxValue = values[fieldMapping.taxInclusive].toLowerCase();
          product.taxInclusive = taxValue === 'true' || taxValue === '1' || taxValue === 'yes';
        }

        products.push(product);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid products found in CSV',
        errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Bulk insert products
    await bulkCreateProducts(products);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported ${products.length} products`,
      imported: products.length,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error uploading CSV:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process CSV file'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};