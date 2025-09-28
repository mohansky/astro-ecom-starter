import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '../react-ui/Button';
import type { Order } from '../../types/order';

interface OrderColumnsProps {
  onView?: (order: Order) => void;
}

export const createOrderColumns = ({
  onView,
}: OrderColumnsProps = {}): ColumnDef<Order>[] => [
  {
    accessorKey: 'orderNumber',
    header: 'Order #',
    cell: ({ row }) => {
      const orderNumber = row.getValue('orderNumber') as string;
      return <span className="font-mono text-sm">{orderNumber}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{order.customerName}</span>
          <span className="text-sm text-base-content/60">
            {order.customerEmail}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'items',
    header: 'Items',
    cell: ({ row }) => {
      const order = row.original;
      const itemCount = order.items?.length || 0;
      return (
        <span>
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => {
      const total = row.getValue('total') as number;
      return <span className="font-medium">₹{total.toFixed(2)}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const statusStyles = {
        pending: 'badge-warning',
        processing: 'badge-info',
        shipped: 'badge-primary',
        delivered: 'badge-success',
        cancelled: 'badge-error',
      };

      return (
        <div
          className={`badge ${statusStyles[status as keyof typeof statusStyles]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
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
      const order = row.original;

      return (
        <div className="flex items-center space-x-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(order);
              }}
              className="btn-sm"
            >
              View
            </Button>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
];

export const orderColumns = createOrderColumns();
