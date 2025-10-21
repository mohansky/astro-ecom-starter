import React, { useState } from 'react';
import { DataTable } from '../react-ui/DataTable';
import { Modal } from '../react-ui/Modal';
import { Button } from '../react-ui/Button';
import { createCustomerColumns } from '../columns/customer-columns';
import { useCustomers, useDeleteCustomer } from '../../hooks/useCustomers';
import { useAdminUIStore } from '../../stores/adminUIStore';
import { toast } from 'sonner';
import type { Customer } from '../../types/customer';
import { QueryProvider } from '@/providers/QueryProvider';

function CustomersDataTableContent() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Get filter state from Zustand
  const { customerSearch, customerLimit, customerOffset } = useAdminUIStore();

  // Fetch customers with React Query
  const { data, isLoading, error, refetch } = useCustomers({
    search: customerSearch,
    limit: customerLimit,
    offset: customerOffset,
  });

  const deleteMutation = useDeleteCustomer();

  const customers = data?.customers || [];

  const handleViewCustomer = (customer: Customer) => {
    window.location.href = `/admin/customers/${customer.id}`;
  };

  const handleEditCustomer = (customer: Customer) => {
    // You can implement a customer edit modal here
    console.log('Edit customer:', customer);
    toast.info('Customer edit functionality not implemented yet');
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;

    deleteMutation.mutate(customerToDelete.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
      },
    });
  };

  const handleRowClick = (customer: Customer) => {
    handleViewCustomer(customer);
  };

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
        loading={isLoading}
        onRowClick={handleRowClick}
        onRefresh={() => { refetch(); }}
        showRefresh={true}
        refreshDisabled={isLoading}
        refreshText="Refresh"
        renderMobileCard={renderMobileCard}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Customer"
        size="sm"
      >
        <div className="py-4">
          <p className="mb-4">
            Are you sure you want to delete customer{' '}
            <strong>
              {customerToDelete?.firstName} {customerToDelete?.lastName}
            </strong>
            ?
          </p>
          <p className="text-sm opacity-70 mb-4">
            This action cannot be undone and will also delete:
          </p>
          <ul className="list-disc list-inside text-sm opacity-70 mb-6 space-y-1">
            <li>{customerToDelete?.orderCount || 0} associated order(s)</li>
            <li>All order items and history</li>
            <li>Customer contact information</li>
          </ul>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="error"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function CustomersDataTable() {
  return (
    <QueryProvider>
      <CustomersDataTableContent />
    </QueryProvider>
  );
}
