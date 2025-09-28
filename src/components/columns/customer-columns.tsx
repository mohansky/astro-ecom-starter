import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '../react-ui/Button';
import type { Customer } from '../../types/customer';

interface CustomerColumnsProps {
  onView?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export const createCustomerColumns = ({
  onView,
  onEdit,
  onDelete,
}: CustomerColumnsProps = {}): ColumnDef<Customer>[] => [
  {
    accessorKey: 'firstName',
    header: 'Name',
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {customer.firstName} {customer.lastName}
          </span>
          <span className="text-sm opacity-60">{customer.email}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
    cell: ({ row }) => {
      const phoneNumber = row.getValue('phoneNumber') as string;
      return phoneNumber || '-';
    },
    enableSorting: true,
  },
  {
    accessorKey: 'city',
    header: 'Location',
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{customer.city}</span>
          <span className="text-sm opacity-60">{customer.state}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'orderCount',
    header: 'Orders',
    cell: ({ row }) => {
      const orderCount = row.getValue('orderCount') as number;
      return (
        <div className="text-center">
          <span className="badge badge-outline">{orderCount}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'totalSpent',
    header: 'Total Spent',
    cell: ({ row }) => {
      const totalSpent = row.getValue('totalSpent') as number;
      return (
        <span className="font-medium">
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
          }).format(totalSpent)}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Joined',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      return new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const customer = row.original;

      return (
        <div className="flex items-center space-x-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(customer);
              }}
              className="btn-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View
            </Button>
          )}
          {/* {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(customer);
              }}
              className="btn-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          )} */}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(customer);
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

export const customerColumns = createCustomerColumns();
