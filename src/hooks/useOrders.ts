import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Order, OrdersResponse } from '../types/order';

interface UseOrdersOptions {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// Query Keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: UseOrdersOptions) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// Fetch orders
async function fetchOrders(options: UseOrdersOptions = {}): Promise<OrdersResponse> {
  const { search, status, limit = 20, offset = 0 } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (search?.trim()) params.set('search', search.trim());
  if (status?.trim()) params.set('status', status.trim());

  const response = await fetch(`/api/orders?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data: OrdersResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to load orders');
  }

  return data;
}

// Hook: useOrders
export function useOrders(options: UseOrdersOptions = {}) {
  return useQuery({
    queryKey: orderKeys.list(options),
    queryFn: () => fetchOrders(options),
    staleTime: 1000 * 60 * 2, // 2 minutes - orders change frequently
  });
}

// Fetch single order
async function fetchOrder(id: string): Promise<Order> {
  const response = await fetch(`/api/orders/${id}`);
  const data: OrdersResponse = await response.json();

  if (!data.success || !data.orders || data.orders.length === 0) {
    throw new Error('Order not found');
  }

  return data.orders[0];
}

// Hook: useOrder
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  });
}

// Update order status
async function updateOrderStatus({ id, status }: { id: string; status: string }): Promise<void> {
  const response = await fetch(`/api/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to update order status');
  }
}

// Hook: useUpdateOrderStatus
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      toast.success('Order status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });
}

// Delete order
async function deleteOrder(id: string): Promise<void> {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete order');
  }
}

// Hook: useDeleteOrder
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success('Order deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete order');
    },
  });
}
