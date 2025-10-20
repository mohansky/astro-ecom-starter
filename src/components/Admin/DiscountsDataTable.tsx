import React, { useState } from 'react';
import { toast } from 'sonner';
import { DiscountModal } from './DiscountModal';
import { useDiscounts, useDeleteDiscount, useUpdateDiscount } from '../../hooks/useDiscounts';
import { useAdminUIStore } from '../../stores/adminUIStore';
import type { Discount } from '../../types/discount';
import { QueryProvider } from '@/providers/QueryProvider';

interface DiscountsDataTableProps {
  onAddDiscount?: () => void;
}

function DiscountsDataTableContent({ onAddDiscount }: DiscountsDataTableProps) {
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | undefined>(undefined);

  // Get filter state and modal state from Zustand
  const {
    discountSearch,
    discountActive,
    discountLimit,
    discountOffset,
    isAddDiscountModalOpen,
    openAddDiscountModal,
    closeAddDiscountModal
  } = useAdminUIStore();

  // Fetch discounts with React Query
  const { data, isLoading, error, refetch } = useDiscounts({
    search: discountSearch,
    isActive: discountActive,
    limit: discountLimit,
    offset: discountOffset,
  });

  const deleteMutation = useDeleteDiscount();
  const updateMutation = useUpdateDiscount();

  const discounts = data?.discounts || [];

  const handleAddDiscount = () => {
    setSelectedDiscountId(undefined);
    openAddDiscountModal();
  };

  const handleEditDiscount = (discount: Discount) => {
    setSelectedDiscountId(discount.id);
    openAddDiscountModal();
  };

  const handleCloseModal = () => {
    closeAddDiscountModal();
    setSelectedDiscountId(undefined);
  };

  const handleModalSuccess = (discount: Discount) => {
    toast.success(
      `Discount ${selectedDiscountId ? 'updated' : 'created'} successfully!`
    );
    refetch();
  };

  const handleDeleteDiscount = async (discount: Discount) => {
    if (
      !confirm(
        `Are you sure you want to delete discount "${discount.code}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    deleteMutation.mutate(discount.id.toString());
  };

  const handleToggleStatus = async (discount: Discount) => {
    const newStatus = !discount.isActive;

    updateMutation.mutate({
      id: discount.id.toString(),
      data: { isActive: newStatus }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const renderDesktopTable = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      );
    }

    if (discounts.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-base-content/70">No discounts found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Order</th>
              <th>Valid Period</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => {
              const isExpired = new Date(discount.validTo) < new Date();
              const isNotStarted = new Date(discount.validFrom) > new Date();

              return (
                <tr
                  key={discount.id}
                  className="hover cursor-pointer"
                  onClick={() => handleEditDiscount(discount)}
                >
                  <td>
                    <div>
                      <div className="font-bold">{discount.code}</div>
                      <div className="text-sm opacity-50">
                        {discount.description}
                      </div>
                    </div>
                  </td>
                  <td className="capitalize">{discount.discountType}</td>
                  <td className="font-bold text-primary">
                    {discount.discountType === 'percentage'
                      ? `${discount.discountValue}%`
                      : formatCurrency(discount.discountValue)}
                  </td>
                  <td>{formatCurrency(discount.minimumOrderAmount)}</td>
                  <td>
                    <div className="text-sm">
                      <div>{formatDate(discount.validFrom)}</div>
                      <div className="opacity-50">
                        to {formatDate(discount.validTo)}
                      </div>
                    </div>
                  </td>
                  <td>
                    {discount.usedCount}
                    {discount.usageLimit ? `/${discount.usageLimit}` : ''}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`badge ${discount.isActive ? 'badge-success' : 'badge-error'} badge-sm`}
                      >
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isExpired && (
                        <span className="badge badge-error badge-xs">
                          Expired
                        </span>
                      )}
                      {isNotStarted && (
                        <span className="badge badge-warning badge-xs">
                          Not Started
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className={`btn btn-xs ${discount.isActive ? 'btn-warning' : 'btn-success'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(discount);
                        }}
                      >
                        {discount.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDiscount(discount);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDiscount(discount);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderMobileCards = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      );
    }

    if (discounts.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-base-content/70">No discounts found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 md:hidden">
        {discounts.map((discount) => {
          const isExpired = new Date(discount.validTo) < new Date();
          const isNotStarted = new Date(discount.validFrom) > new Date();

          return (
            <div
              key={discount.id}
              className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleEditDiscount(discount)}
            >
              <div className="card-body p-4">
                {/* Header with discount code and status */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-base">{discount.code}</h3>
                    <p className="text-sm opacity-60 line-clamp-2">
                      {discount.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div
                      className={`badge ${discount.isActive ? 'badge-success' : 'badge-error'}`}
                    >
                      {discount.isActive ? 'Active' : 'Inactive'}
                    </div>
                    {isExpired && (
                      <div className="badge badge-error badge-sm">Expired</div>
                    )}
                    {isNotStarted && (
                      <div className="badge badge-warning badge-sm">
                        Not Started
                      </div>
                    )}
                  </div>
                </div>

                {/* Discount details grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium opacity-70">Discount:</span>
                    <p className="mt-1 font-bold text-primary">
                      {discount.discountType === 'percentage'
                        ? `${discount.discountValue}%`
                        : formatCurrency(discount.discountValue)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium opacity-70">Min Order:</span>
                    <p className="mt-1">
                      {formatCurrency(discount.minimumOrderAmount)}
                    </p>
                  </div>
                  {discount.maxDiscountAmount && (
                    <div>
                      <span className="font-medium opacity-70">
                        Max Discount:
                      </span>
                      <p className="mt-1">
                        {formatCurrency(discount.maxDiscountAmount)}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium opacity-70">Usage:</span>
                    <p className="mt-1">
                      {discount.usedCount}
                      {discount.usageLimit ? `/${discount.usageLimit}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium opacity-70">Valid From:</span>
                    <p className="mt-1 text-xs">
                      {formatDate(discount.validFrom)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium opacity-70">Valid To:</span>
                    <p className="mt-1 text-xs">
                      {formatDate(discount.validTo)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-base-200">
                  <button
                    className={`btn btn-sm ${discount.isActive ? 'btn-warning' : 'btn-success'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(discount);
                    }}
                  >
                    {discount.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDiscount(discount);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleAddDiscount}
              className="btn btn-primary btn-sm"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Discount
            </button>
          </div>
        </div>

        {/* Desktop Table - hidden on mobile */}
        <div className="hidden md:block">{renderDesktopTable()}</div>

        {/* Mobile Cards - shown on mobile only */}
        {renderMobileCards()}
      </div>

      {/* Discount Modal */}
      <DiscountModal
        isOpen={isAddDiscountModalOpen}
        discountId={selectedDiscountId}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}

export function DiscountsDataTable({ onAddDiscount }: DiscountsDataTableProps) {
  return (
    <QueryProvider>
      <DiscountsDataTableContent onAddDiscount={onAddDiscount} />
    </QueryProvider>
  );
}
