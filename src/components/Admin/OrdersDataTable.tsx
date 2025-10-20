import React from 'react';
import { DataTable } from '../react-ui/DataTable';
import { createOrderColumns } from '../columns/order-columns';
import { useOrders } from '../../hooks/useOrders';
import { useAdminUIStore } from '../../stores/adminUIStore';
import type { Order } from '../../types/order';
import { getStatusBadgeClass } from '@/lib/helpers';
import { QueryProvider } from '@/providers/QueryProvider';

function OrdersDataTableContent() {
  // Get filter state from Zustand
  const { orderSearch, orderStatus, orderLimit, orderOffset } =
    useAdminUIStore();

  // Fetch orders with React Query
  const { data, isLoading, error, refetch } = useOrders({
    search: orderSearch,
    status: orderStatus,
    limit: orderLimit,
    offset: orderOffset,
  });

  const orders = data?.orders || [];

  const handleViewOrder = (order: Order) => {
    window.location.href = `/admin/orders/${order.id}`;
  };

  const handleRowClick = (order: Order) => {
    handleViewOrder(order);
  };

  const columns = createOrderColumns({
    onView: handleViewOrder,
  });

  const renderMobileCard = (order: Order, index: number) => {
    const badgeClass = getStatusBadgeClass || 'badge-neutral';

    return (
      <div
        className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleRowClick(order)}
      >
        <div className="card-body p-4">
          {/* Header with order number and status */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-base">
                #{order.orderNumber || order.id}
              </h3>
              <p className="text-sm opacity-60">{order.customerName}</p>
              {order.customerEmail && (
                <p className="text-xs opacity-50">{order.customerEmail}</p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-1">
              <div className={`badge ${badgeClass}`}>{order.status}</div>
            </div>
          </div>

          {/* Order details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium opacity-70">Total:</span>
              <p className="mt-1 font-bold text-primary">
                ₹{Number(order.total).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="font-medium opacity-70">Items:</span>
              <p className="mt-1">{order.items?.length || 0} item(s)</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Date:</span>
              <p className="mt-1">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-medium opacity-70">Status:</span>
              <p className="mt-1 capitalize">{order.status}</p>
            </div>
            {order.couponCode && (
              <div className="col-span-2">
                <span className="font-medium opacity-70">Coupon:</span>
                <p className="mt-1">
                  {order.couponCode}
                  {order.couponDiscount &&
                    ` (-₹${Number(order.couponDiscount).toFixed(2)})`}
                </p>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex justify-end mt-4 pt-3 border-t border-base-200">
            <button
              className="btn btn-sm btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleViewOrder(order);
              }}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* DataTable */}
      <DataTable
        columns={columns}
        data={orders}
        searchKey="orderNumber"
        searchPlaceholder="Search orders by order number, customer name, or email..."
        loading={isLoading}
        onRowClick={handleRowClick}
        onRefresh={() => {
          refetch();
        }}
        showRefresh={true}
        refreshDisabled={isLoading}
        refreshText="Refresh"
        renderMobileCard={renderMobileCard}
      />
    </div>
  );
}

export function OrdersDataTable() {
  return (
    <QueryProvider>
      <OrdersDataTableContent />
    </QueryProvider>
  );
}
