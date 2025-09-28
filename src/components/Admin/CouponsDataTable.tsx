import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '../react-ui/DataTable';
import { createCouponColumns } from '../columns/coupon-columns';
import type { Coupon, CouponsResponse } from '../../types/coupon';

interface CouponsDataTableProps {
  onAddCoupon?: () => void;
}

export function CouponsDataTable({ onAddCoupon }: CouponsDataTableProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Load coupons on component mount
  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async (search?: string, isActive?: boolean, offset = 0) => {
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
        throw new Error('Failed to fetch coupons');
      }

      const data: CouponsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load coupons');
      }

      setCoupons(data.coupons || []);

    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('Failed to load coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    // You can implement a coupon edit modal here
    console.log('Edit coupon:', coupon);
    toast.info('Coupon edit functionality not implemented yet');
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Coupon deleted successfully!');
        loadCoupons(); // Reload to show updated list
      } else {
        toast.error(result.error || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const action = coupon.isActive ? 'deactivate' : 'activate';
    const newStatus = !coupon.isActive;

    try {
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: newStatus
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Coupon ${action}d successfully!`);
        loadCoupons(); // Reload to show updated status
      } else {
        toast.error(result.error || `Failed to ${action} coupon`);
      }
    } catch (error) {
      console.error(`Error ${action}ing coupon:`, error);
      toast.error(`Failed to ${action} coupon`);
    }
  };

  const handleRowClick = (coupon: Coupon) => {
    // Navigate to coupon detail view or open edit modal
    console.log('View coupon details:', coupon);
  };

  // Expose loadCoupons globally for potential external use
  useEffect(() => {
    window.loadCoupons = loadCoupons;
    return () => {
      if (window.loadCoupons) {
        window.loadCoupons = undefined;
      }
    };
  }, []);

  const columns = createCouponColumns({
    onEdit: handleEditCoupon,
    onDelete: handleDeleteCoupon,
    onToggleStatus: handleToggleStatus,
  });

  const renderMobileCard = (coupon: Coupon, index: number) => {
    const isExpired = new Date(coupon.validTo) < new Date();
    const isNotStarted = new Date(coupon.validFrom) > new Date();

    return (
      <div
        className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleRowClick(coupon)}
      >
        <div className="card-body p-4">
          {/* Header with coupon code and status */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-base">{coupon.code}</h3>
              <p className="text-sm opacity-60 line-clamp-2">{coupon.description}</p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <div className={`badge ${coupon.isActive ? 'badge-success' : 'badge-error'}`}>
                {coupon.isActive ? 'Active' : 'Inactive'}
              </div>
              {isExpired && <div className="badge badge-error badge-sm">Expired</div>}
              {isNotStarted && <div className="badge badge-warning badge-sm">Not Started</div>}
            </div>
          </div>

          {/* Coupon details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium opacity-70">Discount:</span>
              <p className="mt-1 font-bold text-primary">
                {coupon.discountType === 'percentage'
                  ? `${coupon.discountValue}%`
                  : `₹${coupon.discountValue}`}
              </p>
            </div>
            <div>
              <span className="font-medium opacity-70">Min Order:</span>
              <p className="mt-1">₹{coupon.minimumOrderAmount}</p>
            </div>
            {coupon.maxDiscountAmount && (
              <div>
                <span className="font-medium opacity-70">Max Discount:</span>
                <p className="mt-1">₹{coupon.maxDiscountAmount}</p>
              </div>
            )}
            <div>
              <span className="font-medium opacity-70">Usage:</span>
              <p className="mt-1">
                {coupon.usedCount}
                {coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
              </p>
            </div>
            <div>
              <span className="font-medium opacity-70">Valid From:</span>
              <p className="mt-1 text-xs">{new Date(coupon.validFrom).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Valid To:</span>
              <p className="mt-1 text-xs">{new Date(coupon.validTo).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-base-200">
            <button
              className={`btn btn-sm ${coupon.isActive ? 'btn-warning' : 'btn-success'}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(coupon);
              }}
            >
              {coupon.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCoupon(coupon);
              }}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCoupon(coupon);
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
        <div>
          <h2 className="text-2xl font-bold">Discount Coupons</h2>
          <p className="text-sm text-base-content/70">Create and manage discount coupons for your store</p>
        </div>
        <div className="flex gap-2">
          {onAddCoupon && (
            <button
              onClick={onAddCoupon}
              className="btn btn-primary btn-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Coupon
            </button>
          )}
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={coupons}
        searchKey="code"
        searchPlaceholder="Search coupons by code or description..."
        loading={loading}
        onRowClick={handleRowClick}
        onRefresh={() => loadCoupons()}
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
    loadCoupons?: (search?: string, isActive?: boolean, offset?: number) => void;
  }
}