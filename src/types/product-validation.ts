import { z } from 'zod';

export const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  slug: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
  subcategory: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  mrp: z.number().min(0, 'MRP cannot be negative'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  weight: z.number().min(0, 'Weight cannot be negative'),
  gstPercentage: z.number().min(0, 'GST percentage must be at least 0').max(100, 'GST percentage must be at most 100'),
  taxInclusive: z.boolean(),
  dimensions: z.string().optional(),
  mainImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.string().optional(),
  isActive: z.boolean(),
  featured: z.boolean(),
});

export type ProductFormSchema = z.infer<typeof productFormSchema>;

export const defaultProductFormValues: ProductFormSchema = {
  name: '',
  slug: '',
  sku: '',
  description: '',
  category: '',
  subcategory: '',
  price: 0,
  mrp: 0,
  stock: 0,
  weight: 0,
  gstPercentage: 5,
  taxInclusive: false,
  dimensions: '',
  mainImage: '',
  images: [],
  tags: '',
  isActive: true,
  featured: false,
};