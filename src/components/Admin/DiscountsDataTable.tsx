import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '../react-ui/DataTable';
import { createCouponColumns } from '../columns/coupon-columns';
import type { Coupon, CouponsResponse } from '../../types/coupon';

interface DiscountsDataTableProps {
  onAddDiscount?: () => void;
}

export function DiscountsDataTable({ onAddDiscount }: DiscountsDataTableProps) {
  const [discounts, setDiscounts] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Load discounts on component mount
  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async (
    search?: string,
    isActive?: boolean,
    offset = 0
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
      });

      if (search?.trim()) {
        params.set('search', search.trim());
      }

      if (isActive !== undefined) {
        params.set('isActive', isActive.toString());
      }

      const response = await fetch(`/api/coupons?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch discounts');
      }

      const data: CouponsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load discounts');
      }

      setDiscounts(data.coupons || []);
    } catch (error) {
      console.error('Error loading discounts:', error);
      toast.error('Failed to load discounts');
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDiscount = (discount: Coupon) => {
    // You can implement a discount edit modal here or emit to parent
    console.log('Edit discount:', discount);
    if (typeof window !== 'undefined' && window.editDiscount) {
      window.editDiscount(discount.id);
    } else {
      toast.info('Discount edit functionality not implemented yet');
    }
  };

  const handleDeleteDiscount = async (discount: Coupon) => {
    if (
      !confirm(
        `Are you sure you want to delete discount "${discount.code}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/coupons/${discount.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Discount deleted successfully!');
        loadDiscounts(); // Reload to show updated list
      } else {
        toast.error(result.error || 'Failed to delete discount');
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error('Failed to delete discount');
    }
  };

  const handleToggleStatus = async (discount: Coupon) => {
    const action = discount.isActive ? 'deactivate' : 'activate';
    const newStatus = !discount.isActive;

    try {
      const response = await fetch(`/api/coupons/${discount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Discount ${action}d successfully!`);
        loadDiscounts(); // Reload to show updated status
      } else {
        toast.error(result.error || `Failed to ${action} discount`);
      }
    } catch (error) {
      console.error(`Error ${action}ing discount:`, error);
      toast.error(`Failed to ${action} discount`);
    }
  };

  const handleRowClick = (discount: Coupon) => {
    // Navigate to discount detail view or open edit modal
    console.log('View discount details:', discount);
  };

  // Expose loadDiscounts globally for potential external use
  useEffect(() => {
    window.loadDiscounts = loadDiscounts;
    return () => {
      if (window.loadDiscounts) {
        window.loadDiscounts = undefined;
      }
    };
  }, []);

  const columns = createCouponColumns({
    onEdit: handleEditDiscount,
    onDelete: handleDeleteDiscount,
    onToggleStatus: handleToggleStatus,
  });

  const renderMobileCard = (discount: Coupon, index: number) => {
    const isExpired = new Date(discount.validTo) < new Date();
    const isNotStarted = new Date(discount.validFrom) > new Date();

    return (
      <div
        className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleRowClick(discount)}
      >
        <div className="card-body p-4">
          {/* Header with discount code and status */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-base">{discount.code}</h3>
              <p className="text-sm opacity-60 line-clamp-2">{discount.description}</p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <div className={`badge ${discount.isActive ? 'badge-success' : 'badge-error'}`}>
                {discount.isActive ? 'Active' : 'Inactive'}
              </div>
              {isExpired && <div className="badge badge-error badge-sm">Expired</div>}
              {isNotStarted && <div className="badge badge-warning badge-sm">Not Started</div>}
            </div>
          </div>

          {/* Discount details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium opacity-70">Discount:</span>
              <p className="mt-1 font-bold text-primary">
                {discount.discountType === 'percentage'
                  ? `${discount.discountValue}%`
                  : `₹${discount.discountValue}`}
              </p>
            </div>
            <div>
              <span className="font-medium opacity-70">Min Order:</span>
              <p className="mt-1">₹{discount.minimumOrderAmount}</p>
            </div>
            {discount.maxDiscountAmount && (
              <div>
                <span className="font-medium opacity-70">Max Discount:</span>
                <p className="mt-1">₹{discount.maxDiscountAmount}</p>
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
              <p className="mt-1 text-xs">{new Date(discount.validFrom).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Valid To:</span>
              <p className="mt-1 text-xs">{new Date(discount.validTo).toLocaleDateString()}</p>
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
              className="btn btn-sm btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEditDiscount(discount);
              }}
            >
              Edit
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
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.openDiscountModal) {
                window.openDiscountModal();
              }
            }}
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

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={discounts}
        searchKey="code"
        searchPlaceholder="Search discount codes..."
        loading={loading}
        onRowClick={handleRowClick}
        onRefresh={() => loadDiscounts()}
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
    loadDiscounts?: (
      search?: string,
      isActive?: boolean,
      offset?: number
    ) => void;
    editDiscount?: (id: number) => void;
    openDiscountModal?: (discount?: any) => void;
  }
}
