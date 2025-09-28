import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '../react-ui/DataTable';
import { createUserColumns } from '../columns/user-columns';
// import { useErrorHandler, SessionExpiredPrompt } from '../react-ui/ErrorBoundary'; // TODO: Fix ErrorBoundary utilities
import type { User, UsersResponse } from '../../types/user';
import { getInitialsAvatar } from '../../lib/helpers';

interface UsersDataTableProps {
  r2BucketUrl?: string;
}

export function UsersDataTable({ r2BucketUrl }: UsersDataTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSessionError, setHasSessionError] = useState(false);
  // const { handleError } = useErrorHandler(); // TODO: Fix ErrorBoundary utilities

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (search?: string, role?: string, offset = 0) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
      });

      if (search?.trim()) {
        params.set('search', search.trim());
      }

      if (role?.trim()) {
        params.set('role', role.trim());
      }

      const response = await fetch(`/api/users?${params}`);

      if (!response.ok) {
        // Create error with status for better handling
        const error = new Error(
          `Failed to fetch users: ${response.status} ${response.statusText}`
        );
        (error as any).status = response.status;
        throw error;
      }

      const data: UsersResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load users');
      }

      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error loading users:', error);

      // Check if it's a 500 error or session-related
      if (error?.status === 500 || error?.message?.includes('500')) {
        setHasSessionError(true);
        // handleError(error); // TODO: Fix ErrorBoundary utilities
        console.error('Error loading users:', error);
      } else {
        toast.error('Failed to load users');
      }

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

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

    try {
      const response = await fetch(`/api/admin/delete-user`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('User deleted successfully!');
        loadUsers(); // Reload to show updated list
      } else {
        toast.error(result.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.emailVerified ? 'suspend' : 'activate';
    const newStatus = !user.emailVerified;

    try {
      const response = await fetch(`/api/admin/verify-user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          emailVerified: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`User ${action}d successfully!`);
        loadUsers(); // Reload to show updated status
      } else {
        toast.error(result.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    if (user.role === newRole) {
      return; // No change needed
    }

    try {
      const response = await fetch(`/api/admin/change-user-role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newRole: newRole,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`User role changed to ${newRole} successfully!`);
        loadUsers(); // Reload to show updated role
      } else {
        toast.error(result.error || 'Failed to change user role');
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      toast.error('Failed to change user role');
    }
  };

  const handleRowClick = (user: User) => {
    // Navigate to user detail page if it exists
    console.log('View user details:', user);
  };

  // Expose loadUsers globally for potential external use
  useEffect(() => {
    window.loadUsers = loadUsers;
    return () => {
      if (window.loadUsers) {
        window.loadUsers = undefined;
      }
    };
  }, []);

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
              <span className="font-medium opacity-70">Username:</span>
              <p className="mt-1">{user.username || 'N/A'}</p>
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
                  <option value="customer">Customer</option>
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
          {/* <SessionExpiredPrompt onRefresh={() => window.location.reload()} /> TODO: Fix ErrorBoundary utilities */}
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
        loading={loading}
        onRowClick={handleRowClick}
        onRefresh={() => loadUsers()}
        showRefresh={true}
        refreshDisabled={loading}
        refreshText="Refresh"
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}

// Extend window type for TypeScript
declare global {
  interface Window {
    loadUsers?: (search?: string, role?: string, offset?: number) => void;
  }
}
