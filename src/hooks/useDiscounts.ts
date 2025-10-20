import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Discount, DiscountsResponse } from '../types/discount';

interface UseDiscountsOptions {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

// Query Keys
export const discountKeys = {
  all: ['discounts'] as const,
  lists: () => [...discountKeys.all, 'list'] as const,
  list: (filters: UseDiscountsOptions) => [...discountKeys.lists(), filters] as const,
  details: () => [...discountKeys.all, 'detail'] as const,
  detail: (id: string) => [...discountKeys.details(), id] as const,
};

// Fetch discounts
async function fetchDiscounts(options: UseDiscountsOptions = {}): Promise<DiscountsResponse> {
  const { search, isActive, limit = 20, offset = 0 } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (search?.trim()) params.set('search', search.trim());
  if (isActive !== undefined) params.set('isActive', String(isActive));

  const response = await fetch(`/api/discounts?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch discounts');
  }

  const data: DiscountsResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to load discounts');
  }

  // API returns 'coupons' key for backward compatibility
  return {
    ...data,
    discounts: data.coupons
  };
}

// Hook: useDiscounts
export function useDiscounts(options: UseDiscountsOptions = {}) {
  return useQuery({
    queryKey: discountKeys.list(options),
    queryFn: () => fetchDiscounts(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single discount
async function fetchDiscount(id: string): Promise<Discount> {
  const response = await fetch(`/api/discounts/${id}`);
  const data: DiscountsResponse = await response.json();

  // API returns 'coupons' key for backward compatibility
  const discounts = data.coupons;

  if (!data.success || !discounts || discounts.length === 0) {
    throw new Error('Discount not found');
  }

  return discounts[0];
}

// Hook: useDiscount
export function useDiscount(id: string) {
  return useQuery({
    queryKey: discountKeys.detail(id),
    queryFn: () => fetchDiscount(id),
    enabled: !!id,
  });
}

// Create discount
async function createDiscount(discountData: Partial<Discount>): Promise<Discount> {
  const response = await fetch('/api/discounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discountData),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to create discount');
  }

  return data.discount;
}

// Hook: useCreateDiscount
export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
      toast.success('Discount created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create discount');
    },
  });
}

// Update discount
async function updateDiscount({ id, data }: { id: string; data: Partial<Discount> }): Promise<Discount> {
  const response = await fetch(`/api/discounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to update discount');
  }

  return result.discount;
}

// Hook: useUpdateDiscount
export function useUpdateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDiscount,
    onSuccess: (updatedDiscount) => {
      queryClient.setQueryData(discountKeys.detail(updatedDiscount.id.toString()), updatedDiscount);
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
      toast.success('Discount updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update discount');
    },
  });
}

// Delete discount
async function deleteDiscount(id: string): Promise<void> {
  const response = await fetch(`/api/discounts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete discount');
  }
}

// Hook: useDeleteDiscount
export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
      toast.success('Discount deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete discount');
    },
  });
}
