import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User } from '../types/user';

// Query Keys
export const profileKeys = {
  all: ['profile'] as const,
  user: (id: string) => [...profileKeys.all, id] as const,
};

// Fetch current user
async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  const data = await response.json();

  if (!data.success || !data.users || data.users.length === 0) {
    throw new Error('User not found');
  }

  return data.users[0];
}

// Hook: useUser
export function useUser(userId: string) {
  return useQuery({
    queryKey: profileKeys.user(userId),
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Update user profile
async function updateUser({ id, data }: { id: string; data: Partial<User> }): Promise<User> {
  // Use our API endpoint instead of Better Auth directly
  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to update profile');
  }

  return result.user;
}

// Hook: useUpdateUser
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(profileKeys.user(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      toast.success('Profile updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

// Delete account
async function deleteAccount(): Promise<void> {
  const response = await fetch('/api/auth/delete-account', {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete account');
  }
}

// Hook: useDeleteAccount
export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success('Account deleted successfully. Redirecting...');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });
}

// Upload avatar
async function uploadAvatar({ file, userId }: { file: File; userId: string }): Promise<string> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/users/upload-avatar', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }

  // Update user's avatar in database using the PUT endpoint
  const updateResponse = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: result.avatarPath,
    }),
  });

  const updateResult = await updateResponse.json();

  if (!updateResponse.ok || !updateResult.success) {
    throw new Error('Failed to update avatar in database');
  }

  return result.avatarPath;
}

// Hook: useUploadAvatar
export function useUploadAvatar(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar({ file, userId }),
    onSuccess: (avatarPath) => {
      // Update the cache immediately with new avatar
      queryClient.setQueryData(profileKeys.user(userId), (oldData: User | undefined) => {
        if (oldData) {
          return { ...oldData, image: avatarPath };
        }
        return oldData;
      });
      // Also invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userId) });
      toast.success('Avatar uploaded successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload avatar');
    },
  });
}
