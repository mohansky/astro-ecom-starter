import React, { useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '../react-ui/DataTable';
import { createUserColumns } from '../columns/user-columns';
import { useUsers, useDeleteUser, useUpdateUser } from '../../hooks/useUsers';
import { useAdminUIStore } from '../../stores/adminUIStore';
import type { User } from '../../types/user';
import { getInitialsAvatar } from '../../lib/helpers';
import { QueryProvider } from '@/providers/QueryProvider';

interface UsersDataTableProps {
  r2BucketUrl?: string;
}

function UsersDataTableContent({ r2BucketUrl }: UsersDataTableProps) {
  const [hasSessionError, setHasSessionError] = useState(false);

  // Get filter state from Zustand
  const { userSearch, userRole, userLimit, userOffset } = useAdminUIStore();

  // Fetch users with React Query
  const { data, isLoading, error, refetch } = useUsers({
    search: userSearch,
    role: userRole,
    limit: userLimit,
    offset: userOffset,
  });

  const deleteMutation = useDeleteUser();
  const updateMutation = useUpdateUser();

  const users = data?.users || [];

  const handleEditUser = (user: User) => {
    // You can implement a user edit modal here
    console.log('Edit user:', user);
    toast.info('User edit functionality not implemented yet');
  };

  const handleDeleteUser = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    deleteMutation.mutate(user.id);
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.emailVerified;

    updateMutation.mutate({
      id: user.id,
      data: { emailVerified: newStatus }
    });
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    if (user.role === newRole) {
      return; // No change needed
    }

    // Validate role is either 'admin' or 'user'
    if (newRole !== 'admin' && newRole !== 'user') {
      toast.error('Invalid role selected');
      return;
    }

    updateMutation.mutate({
      id: user.id,
      data: { role: newRole as 'admin' | 'user' }
    });
  };

  const handleRowClick = (user: User) => {
    // Navigate to user detail page if it exists
    console.log('View user details:', user);
  };

  const columns = createUserColumns({
    onEdit: handleEditUser,
    onDelete: handleDeleteUser,
    onToggleStatus: handleToggleStatus,
    onChangeRole: handleChangeRole,
    r2BucketUrl,
  });

  const renderMobileCard = (user: User, index: number) => {
    const initialsUrl = getInitialsAvatar(user.name);
    let avatarUrl = initialsUrl;

    if (user.image) {
      if (user.image.startsWith('http')) {
        avatarUrl = user.image;
      } else {
        avatarUrl = `${r2BucketUrl}/users/${user.image}/${user.image}.jpg`;
      }
    }

    return (
      <div
        className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleRowClick(user)}
      >
        <div className="card-body p-4">
          {/* Header with avatar and name */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="avatar">
              <div className="w-12 rounded-full">
                <img
                  src={avatarUrl}
                  alt={user.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== initialsUrl) {
                      target.src = initialsUrl;
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">{user.name}</h3>
              <p className="text-sm opacity-60">{user.email}</p>
            </div>
          </div>

          {/* User details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium opacity-70">Email:</span>
              <p className="mt-1 truncate">{user.email}</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Role:</span>
              <div className="mt-1">
                <select
                  className="select select-sm select-bordered w-full"
                  value={user.role}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleChangeRole(user, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div>
              <span className="font-medium opacity-70">Status:</span>
              <div className="mt-1">
                <div className={`badge ${user.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                  {user.emailVerified ? 'Verified' : 'Pending'}
                </div>
              </div>
            </div>
            <div>
              <span className="font-medium opacity-70">Last Login:</span>
              <p className="mt-1">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Joined:</span>
              <p className="mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-base-200">
            <button
              className={`btn btn-sm ${user.emailVerified ? 'btn-warning' : 'btn-success'}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(user);
              }}
            >
              {user.emailVerified ? 'Suspend' : 'Activate'}
            </button>
            <button
              className="btn btn-sm btn-error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteUser(user);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show session expired prompt if there's a session error
  if (hasSessionError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center min-h-64">
          <div className="alert alert-warning">
            <span>Session expired. Please refresh the page.</span>
            <button
              className="btn btn-sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DataTable */}
      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Search users by name or email..."
        loading={isLoading}
        onRowClick={handleRowClick}
        onRefresh={() => { refetch(); }}
        showRefresh={true}
        refreshDisabled={isLoading}
        refreshText="Refresh"
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}

export function UsersDataTable({ r2BucketUrl }: UsersDataTableProps) {
  return (
    <QueryProvider>
      <UsersDataTableContent r2BucketUrl={r2BucketUrl} />
    </QueryProvider>
  );
}
