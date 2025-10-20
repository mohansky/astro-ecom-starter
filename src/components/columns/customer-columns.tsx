import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '../react-ui/Button';
import type { Customer } from '../../types/customer';
import { ViewIcon } from '../Icons/ViewIcon';
import { TrashIcon } from '../Icons/TrashIcon';

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
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(customer);
              }}
              className="btn-sm"
            >
              <ViewIcon size={12} />
              View
            </Button>
          )}
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
              <TrashIcon size={12} className="text-error" />
            </Button>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
];

export const customerColumns = createCustomerColumns();
