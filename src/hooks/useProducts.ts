import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Product, ProductsResponse } from '@/types/product';

interface UseProductsOptions {
  search?: string;
  category?: string;
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: UseProductsOptions) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Fetch products
async function fetchProducts(options: UseProductsOptions = {}): Promise<ProductsResponse> {
  const { search, category, limit = 20, offset = 0, isActive } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (search?.trim()) params.set('search', search.trim());
  if (category?.trim()) params.set('category', category.trim());
  if (isActive !== undefined) params.set('isActive', String(isActive));

  const response = await fetch(`/api/products?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data: ProductsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to load products');
  }

  return data;
}

// Hook: useProducts
export function useProducts(options: UseProductsOptions = {}) {
  return useQuery({
    queryKey: productKeys.list(options),
    queryFn: () => fetchProducts(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single product
async function fetchProduct(id: string): Promise<Product> {
  const response = await fetch(`/api/products?id=${id}`);
  const data: ProductsResponse = await response.json();

  if (!data.success || !data.products || data.products.length === 0) {
    throw new Error('Product not found');
  }

  return data.products[0];
}

// Hook: useProduct
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id, // Only run if id exists
  });
}

// Delete product
async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`/api/products?id=${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete product');
  }
}

// Hook: useDeleteProduct
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate and refetch all product lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });
}

// Create product
async function createProduct(productData: Partial<Product>): Promise<Product> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to create product');
  }

  return data.product;
}

// Hook: useCreateProduct
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product created successfully');
      return newProduct;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product');
    },
  });
}

// Update product
async function updateProduct({ id, data }: { id: string; data: Partial<Product> }): Promise<Product> {
  const response = await fetch(`/api/products?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to update product');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to update product');
  }

  return result.product;
}

// Hook: useUpdateProduct
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (updatedProduct) => {
      // Update the cache for this specific product
      queryClient.setQueryData(productKeys.detail(updatedProduct.id), updatedProduct);
      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product');
    },
  });
}
