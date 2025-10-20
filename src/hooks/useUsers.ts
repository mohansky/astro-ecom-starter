import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User, UsersResponse } from '../types/user';

interface UseUsersOptions {
  search?: string;
  role?: string;
  emailVerified?: boolean;
  limit?: number;
  offset?: number;
}

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UseUsersOptions) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Fetch users
async function fetchUsers(options: UseUsersOptions = {}): Promise<UsersResponse> {
  const { search, role, emailVerified, limit = 20, offset = 0 } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (search?.trim()) params.set('search', search.trim());
  if (role) params.set('role', role);
  if (emailVerified !== undefined) params.set('emailVerified', String(emailVerified));

  const response = await fetch(`/api/users?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  const data: UsersResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to load users');
  }

  return data;
}

// Hook: useUsers
export function useUsers(options: UseUsersOptions = {}) {
  return useQuery({
    queryKey: userKeys.list(options),
    queryFn: () => fetchUsers(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch single user
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data: UsersResponse = await response.json();

  if (!data.success || !data.users || data.users.length === 0) {
    throw new Error('User not found');
  }

  return data.users[0];
}

// Hook: useUser
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

// Update user
async function updateUser({ id, data }: { id: string; data: Partial<User> }): Promise<User> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to update user');
  }

  return result.user;
}

// Hook: useUpdateUser
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

// Delete user
async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to delete user');
  }
}

// Hook: useDeleteUser
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}
