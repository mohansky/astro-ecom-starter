export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  mrp: number;
  stock: number;
  weight?: number;
  gstPercentage: number;
  taxInclusive: boolean;
  dimensions?: string;
  mainImage?: string;
  images?: string[];
  tags?: string;
  isActive: boolean;
  featured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductFormData {
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  mrp: number;
  stock?: number;
  weight?: number;
  gstPercentage: number;
  taxInclusive: boolean;
  dimensions?: string;
  mainImage?: string;
  images?: string[];
  tags?: string;
  isActive: boolean;
  featured: boolean;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  categories: string[];
  error?: string;
}

export interface ProductResponse {
  success: boolean;
  product?: Product;
  error?: string;
}

export interface ImageUploadResponse {
  success: boolean;
  mainImage?: string;
  images?: string[];
  url?: string;
  error?: string;
}

export interface CSVUploadResponse {
  success: boolean;
  imported: number;
  errors?: string[];
  error?: string;
}