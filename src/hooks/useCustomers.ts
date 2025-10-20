import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Customer, CustomersResponse } from '../types/customer';

interface UseCustomersOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

// Query Keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: UseCustomersOptions) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...customerKeys.details(), id] as const,
};

// Fetch customers
async function fetchCustomers(options: UseCustomersOptions = {}): Promise<CustomersResponse> {
  const { search, limit = 20, offset = 0 } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (search?.trim()) params.set('search', search.trim());

  const response = await fetch(`/api/customers?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }

  const data: CustomersResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to load customers');
  }

  return data;
}

// Hook: useCustomers
export function useCustomers(options: UseCustomersOptions = {}) {
  return useQuery({
    queryKey: customerKeys.list(options),
    queryFn: () => fetchCustomers(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single customer
async function fetchCustomer(id: number | string): Promise<any> {
  const response = await fetch(`/api/customers/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Customer not found');
    }
    throw new Error('Failed to fetch customer details');
  }

  return response.json();
}

// Hook: useCustomer
export function useCustomer(id: number | string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Delete customer
async function deleteCustomer(id: number | string): Promise<void> {
  const response = await fetch(`/api/customers/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete customer');
  }
}

// Hook: useDeleteCustomer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
}
