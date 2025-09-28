import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '../react-ui/DataTable';
import { createOrderColumns } from '../columns/order-columns';
import type { Order, OrdersResponse } from '../../types/order';

export function OrdersDataTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Load orders on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (search?: string, status?: string, offset = 0) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
      });

      if (search?.trim()) {
        params.set('search', search.trim());
      }

      if (status?.trim()) {
        params.set('status', status.trim());
      }

      const response = await fetch(`/api/orders?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data: OrdersResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load orders');
      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    window.location.href = `/admin/orders/${order.id}`;
  };


  const handleRowClick = (order: Order) => {
    handleViewOrder(order);
  };

  // Expose loadOrders globally for potential external use
  useEffect(() => {
    window.loadOrders = loadOrders;
    return () => {
      if (window.loadOrders) {
        window.loadOrders = undefined;
      }
    };
  }, []);

  const columns = createOrderColumns({
    onView: handleViewOrder,
  });

  const renderMobileCard = (order: any, index: number) => {
    const statusBadgeClass = {
      pending: 'badge-warning',
      processing: 'badge-info',
      shipped: 'badge-primary',
      delivered: 'badge-success',
      cancelled: 'badge-error'
    }[order.status] || 'badge-neutral';

    return (
      <div
        className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleRowClick(order)}
      >
        <div className="card-body p-4">
          {/* Header with order number and status */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-base">#{order.orderNumber || order.id}</h3>
              <p className="text-sm opacity-60">{order.customerName}</p>
              {order.customerEmail && (
                <p className="text-xs opacity-50">{order.customerEmail}</p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-1">
              <div className={`badge ${statusBadgeClass}`}>
                {order.status}
              </div>
            </div>
          </div>

          {/* Order details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium opacity-70">Total:</span>
              <p className="mt-1 font-bold text-primary">₹{Number(order.total).toFixed(2)}</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Items:</span>
              <p className="mt-1">{order.items?.length || order.itemCount || 0} item(s)</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Date:</span>
              <p className="mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
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
                  {order.couponDiscount && ` (-₹${Number(order.couponDiscount).toFixed(2)})`}
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
        loading={loading}
        onRowClick={handleRowClick}
        onRefresh={() => loadOrders()}
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
    loadOrders?: (search?: string, status?: string, offset?: number) => void;
  }
}
