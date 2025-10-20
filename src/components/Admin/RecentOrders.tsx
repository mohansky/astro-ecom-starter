import React from 'react';
import { useRecentOrders } from '../../hooks/useAnalytics';
import { DataTable } from '../react-ui/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import {
  formatCurrencyIntl,
  formatDateTimeShort,
  getStatusBadgeClass,
} from '@/lib/helpers';
import { QueryProvider } from '@/providers/QueryProvider';

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  itemCount: number;
  createdAt: string;
}

const columns: ColumnDef<RecentOrder>[] = [
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
    cell: ({ row }) => (
      <div>
        <div className="font-semibold">{row.getValue('customerName')}</div>
        <div className="text-xs opacity-50">{row.original.customerEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: 'itemCount',
    header: 'Items',
    cell: ({ row }) => <span>{row.getValue('itemCount') || 0}</span>,
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => {
      const amount = row.getValue('total') as number;
      return <span className="font-bold">{formatCurrencyIntl(amount)}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const badgeClass = getStatusBadgeClass(status);
      return <span className={`badge ${badgeClass} badge-sm`}>{status}</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const dateString = row.getValue('createdAt') as string;
      return (
        <span className="text-xs opacity-70">
          {formatDateTimeShort(dateString)}
        </span>
      );
    },
  },
];

function RecentOrdersContent() {
  const { data: orders, isLoading, error } = useRecentOrders(10);

  if (error) {
    return (
      <div className="card bg-base-200 shadow-sm w-full mb-5">
        <div className="card-body">
          <div className="alert alert-error">
            <span>Failed to load orders</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm w-full mb-5">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-md">Recent Orders</h2>
          <a href="/admin/orders" className="btn btn-outline btn-sm">
            View All Orders
          </a>
        </div>

        <DataTable
          columns={columns}
          data={orders || []}
          loading={isLoading}
          onRowClick={(order) =>
            (window.location.href = `/admin/orders/${order.id}`)
          }
          searchPlaceholder="Search orders..."
        />
      </div>
    </div>
  );
}

export function RecentOrders() {
  return (
    <QueryProvider>
      <RecentOrdersContent />
    </QueryProvider>
  );
}
