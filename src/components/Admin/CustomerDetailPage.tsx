import React from 'react';
import type { CustomerDetail, CustomerOrder } from '../../types/customer';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import {
  formatCurrencyIntl,
  formatDateLong,
  formatDateTimeShort,
  getStatusBadgeClass,
  formatAddress,
} from '../../lib/helpers';
import { BackArrowIcon } from '../Icons/BackArrowIcon';
import Button from '../react-ui/Button';
import { useCustomer } from '../../hooks/useCustomers';
import { QueryProvider } from '@/providers/QueryProvider';

interface CustomerDetailPageProps {
  customerId: string;
}

function CustomerDetailPageContent({ customerId }: CustomerDetailPageProps) {
  const { data: customer, isLoading, error } = useCustomer(customerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error mb-8">
        <span>
          {error instanceof Error
            ? error.message
            : 'Failed to load customer details'}
        </span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="alert alert-warning mb-8">
        <span>Customer not found</span>
      </div>
    );
  }

  const addressLines = formatAddress(customer);

  return (
    <div>
      <AdminBreadcrumbs
        items={[
          { label: 'Customers', href: '/admin/customers' },
          { label: 'Customer Details' },
        ]}
        pageTitle={`${customer.firstName} ${customer.lastName}`}
        pageDescription={customer.email}
      />

      {/* Header Actions */}
      <div className="flex justify-end mb-8">
        <a href="/admin/customers">
          <Button variant="outline" size="sm">
            <BackArrowIcon size={18} /> Back to Customers
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Information */}
        <div className="lg:col-span-1">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-4">Customer Information</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide mb-1">
                    Full Name
                  </p>
                  <p className="font-semibold">
                    {customer.firstName} {customer.lastName}
                  </p>
                </div>

                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="font-semibold">{customer.email}</p>
                </div>

                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide mb-1">
                    Phone
                  </p>
                  <p className="font-semibold">
                    {customer.phoneNumber || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <div className="font-semibold">
                    {addressLines.length > 0 ? (
                      addressLines.map((line, index) => (
                        <div key={index}>{line}</div>
                      ))
                    ) : (
                      <span className="text-base-content/50">Not provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide mb-1">
                    Customer Since
                  </p>
                  <p className="font-semibold">
                    {formatDateLong(customer.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Stats */}
          <div className="card bg-base-200 shadow-sm mt-6">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-4">Customer Stats</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="stat bg-base-100 rounded-lg p-4">
                  <p className="text-xs opacity-50">Total Orders</p>
                  <h3 className="text-2xl font-bold text-primary">
                    {customer.orderCount}
                  </h3>
                </div>
                <div className="stat bg-base-100 rounded-lg p-4">
                  <p className="text-xs opacity-50">Total Spent</p>
                  <h3 className="text-2xl font-bold text-accent">
                    {formatCurrencyIntl(customer.totalSpent)}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h2 className="text-xl font-bold mb-4">Recent Orders</h2>

              {!customer.orders || customer.orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    ></path>
                  </svg>
                  <h3 className="text-xl font-bold mb-2">No orders yet</h3>
                  <p className="opacity-70">
                    This customer hasn't placed any orders
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.orders.map((order: CustomerOrder) => (
                        <tr key={order.id} className="hover">
                          <td className="font-mono text-sm">#{order.id}</td>
                          <td className="text-sm">
                            {formatDateTimeShort(order.date)}
                          </td>
                          <td className="text-center">{order.itemCount}</td>
                          <td className="font-semibold">
                            {formatCurrencyIntl(order.total)}
                          </td>
                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(order.status)} badge-sm`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomerDetailPage({ customerId }: CustomerDetailPageProps) {
  return (
    <QueryProvider>
      <CustomerDetailPageContent customerId={customerId} />
    </QueryProvider>
  );
}
