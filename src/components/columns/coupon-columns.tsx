import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '../react-ui/Button';
import type { Coupon } from '../../types/coupon';

interface CouponColumnsProps {
  onEdit?: (coupon: Coupon) => void;
  onDelete?: (coupon: Coupon) => void;
  onToggleStatus?: (coupon: Coupon) => void;
}

export const createCouponColumns = ({
  onEdit,
  onDelete,
  onToggleStatus,
}: CouponColumnsProps = {}): ColumnDef<Coupon>[] => [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => {
      const coupon = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-bold">{coupon.code}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'discountValue',
    header: 'Discount',
    cell: ({ row }) => {
      const coupon = row.original;
      const discountText =
        coupon.discountType === 'percentage'
          ? `${coupon.discountValue}%`
          : `₹${coupon.discountValue}`;

      return (
        <div className="flex flex-col">
          <span className="font-bold text-lg">{discountText}</span>
          <span className="text-xs opacity-60 capitalize">
            {coupon.discountType}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'minimumOrderAmount',
    header: 'Min Order',
    cell: ({ row }) => {
      const minimumOrderAmount = row.getValue('minimumOrderAmount') as number;
      return (
        <span className="font-medium">₹{minimumOrderAmount.toFixed(2)}</span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'usedCount',
    header: 'Usage',
    cell: ({ row }) => {
      const coupon = row.original;
      const usageText = coupon.usageLimit
        ? `${coupon.usedCount} / ${coupon.usageLimit}`
        : `${coupon.usedCount}`;

      return (
        <div className="text-center">
          <span className="badge badge-outline">{usageText}</span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const coupon = row.original;
      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validTo = new Date(coupon.validTo);

      let statusBadge = '';
      let statusClass = '';

      if (!coupon.isActive) {
        statusBadge = 'Inactive';
        statusClass = 'badge-error';
      } else if (now < validFrom) {
        statusBadge = 'Not Started';
        statusClass = 'badge-warning';
      } else if (now > validTo) {
        statusBadge = 'Expired';
        statusClass = 'badge-error';
      } else {
        statusBadge = 'Active';
        statusClass = 'badge-success';
      }

      return <div className={`badge ${statusClass}`}>{statusBadge}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'validTo',
    header: 'Valid Until',
    cell: ({ row }) => {
      const validTo = row.getValue('validTo') as string;
      return new Date(validTo).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    },
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      return new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const coupon = row.original;

      return (
        <div className="flex items-center space-x-2">
          {/* {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(coupon);
              }}
              className="btn-sm"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </Button>
          )} */}
          {onToggleStatus && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(coupon);
              }}
              className="btn-sm"
            >
              {coupon.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(coupon);
              }}
              className="btn-sm"
            >
              <svg
                className="w-4 h-4 stroke-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
];

export const couponColumns = createCouponColumns();
