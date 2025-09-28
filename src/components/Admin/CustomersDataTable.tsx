import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '../react-ui/DataTable';
import { createCustomerColumns } from '../columns/customer-columns';
import type { Customer, CustomersResponse } from '../../types/customer';

export function CustomersDataTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (search?: string, offset = 0) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
      });

      if (search?.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`/api/customers?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data: CustomersResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load customers');
      }

      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    window.location.href = `/admin/customers/${customer.id}`;
  };

  const handleEditCustomer = (customer: Customer) => {
    // You can implement a customer edit modal here
    console.log('Edit customer:', customer);
    toast.info('Customer edit functionality not implemented yet');
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (
      !confirm(
        `Are you sure you want to delete customer "${customer.firstName} ${customer.lastName}"? This action cannot be undone and will also delete all associated orders.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/delete-customer`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId: customer.id }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Customer deleted successfully!');
        loadCustomers(); // Reload to show updated list
      } else {
        toast.error(result.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const handleRowClick = (customer: Customer) => {
    handleViewCustomer(customer);
  };

  // Expose loadCustomers globally for potential external use
  useEffect(() => {
    window.loadCustomers = loadCustomers;
    return () => {
      if (window.loadCustomers) {
        window.loadCustomers = undefined;
      }
    };
  }, []);

  const columns = createCustomerColumns({
    onView: handleViewCustomer,
    onEdit: handleEditCustomer,
    onDelete: handleDeleteCustomer,
  });

  const renderMobileCard = (customer: Customer, index: number) => {
    return (
      <div
        className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleRowClick(customer)}
      >
        <div className="card-body p-4">
          {/* Header with customer name */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-base">{customer.firstName} {customer.lastName}</h3>
              <p className="text-sm opacity-60">{customer.email}</p>
              <p className="text-xs opacity-50">{customer.phoneNumber}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">₹{customer.totalSpent.toFixed(2)}</p>
              <p className="text-xs opacity-60">{customer.orderCount} orders</p>
            </div>
          </div>

          {/* Customer details grid */}
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <span className="font-medium opacity-70">Address:</span>
              <p className="mt-1 text-xs">
                {customer.address}<br />
                {customer.city}, {customer.state} {customer.zipCode}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-medium opacity-70">Orders:</span>
                <p className="mt-1 font-medium">{customer.orderCount}</p>
              </div>
              <div>
                <span className="font-medium opacity-70">Joined:</span>
                <p className="mt-1">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-base-200">
            <button
              className="btn btn-sm btn-ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleViewCustomer(customer);
              }}
            >
              View
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCustomer(customer);
              }}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCustomer(customer);
              }}
            >
              Delete
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
        data={customers}
        searchKey="firstName"
        searchPlaceholder="Search customers by name or email..."
        loading={loading}
        onRowClick={handleRowClick}
        onRefresh={() => loadCustomers()}
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
    loadCustomers?: (search?: string, offset?: number) => void;
  }
}
