import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '../react-ui/Button';
import type { User } from '../../types/user';
import { getAvatarUrl, getInitialsAvatar } from '../../lib/helpers';

interface UserColumnsProps {
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  onChangeRole?: (user: User, newRole: string) => void;
  r2BucketUrl?: string;
}

export const createUserColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
  onChangeRole,
  r2BucketUrl,
}: UserColumnsProps = {}): ColumnDef<User>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const user = row.original;
      const initialsUrl = getInitialsAvatar(user.name);
      const workingR2BucketUrl = r2BucketUrl;

      let avatarUrl = initialsUrl;
      if (user.image) {
        // If image is already a full URL, use it directly
        if (user.image.startsWith('http')) {
          avatarUrl = user.image;
        } else {
          // Try exact same pattern as products work
          avatarUrl = `${workingR2BucketUrl}/users/${user.image}/${user.image}.jpg`;
        }
      }

      return (
        <div className="flex items-center space-x-3">
          <div className="avatar">
            <div className="w-8 rounded-full">
              <img
                src={avatarUrl}
                alt={user.name}
                onError={(e) => {
                  // Fallback to initials avatar if R2 image fails
                  const target = e.target as HTMLImageElement;
                  if (target.src !== initialsUrl) {
                    target.src = initialsUrl;
                  }
                }}
              />
            </div>
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm opacity-60">{user.email}</div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'username',
    header: 'Username',
    cell: ({ row }) => {
      const username = row.getValue('username') as string;
      return (
        <div className="flex items-center space-x-3">
          <div className="font-medium">{username}</div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => {
      const user = row.original;
      const role = row.getValue('role') as string;

      if (onChangeRole) {
        return (
          <select
            className="select select-sm w-24 group-hover:bg-base-300"
            value={role}
            onChange={(e) => {
              e.stopPropagation();
              onChangeRole(user, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="customer">Customer</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        );
      }

      return (
        <div
          className={`badge ${role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}
        >
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'emailVerified',
    header: 'Status',
    cell: ({ row }) => {
      const emailVerified = row.getValue('emailVerified') as boolean;
      return (
        <div
          className={`badge ${emailVerified ? 'badge-success' : 'badge-warning'}`}
        >
          {emailVerified ? 'Verified' : 'Pending'}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'lastLoginAt',
    header: 'Last Login',
    cell: ({ row }) => {
      const lastLoginAt = row.getValue('lastLoginAt') as string | undefined;
      return lastLoginAt ? new Date(lastLoginAt).toLocaleDateString() : 'Never';
    },
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      return new Date(createdAt).toLocaleDateString();
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="flex items-center space-x-2">
          {onToggleStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(user);
              }}
              className="btn-sm"
            >
              {user.emailVerified ? 'Suspend' : 'Activate'}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user);
              }}
              className="btn-sm"
            >
              <svg
                className="w-4 h-4 stroke-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
];

export const userColumns = createUserColumns();
