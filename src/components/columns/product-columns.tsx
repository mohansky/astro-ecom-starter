import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '../react-ui/Button';
import type { Product } from '../../types/product';

interface ProductColumnsProps {
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
  r2BucketUrl?: string;
}

export const createProductColumns = ({
  onEdit,
  onDelete,
  onView,
  r2BucketUrl,
}: ProductColumnsProps = {}): ColumnDef<Product>[] => [
  {
    id: 'image',
    header: 'Image',
    cell: ({ row }) => {
      const product = row.original;
      const workingR2BucketUrl =
        r2BucketUrl || 'https://pub-67b76734f5b543b9925c0870089929bb.r2.dev';
      const mainImage = product.mainImage;
      const imageUrl = mainImage
        ? `${workingR2BucketUrl}/products/${product.slug}/${mainImage}`
        : null;

      return (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-base-300 flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-6 h-6 text-base-content/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{product.name}</span>
          {product.sku && (
            <span className="text-sm opacity-60">SKU: {product.sku}</span>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col">
          <span className="badge badge-outline">{product.category}</span>
          {product.subcategory && (
            <span className="text-xs opacity-60 mt-1">
              {product.subcategory}
            </span>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const product = row.original;
      const price = Number(product.price) || 0;
      const mrp = Number(product.mrp) || 0;
      const discountPercent =
        mrp > 0 && price > 0 && price < mrp
          ? Math.round(((mrp - price) / mrp) * 100)
          : 0;

      return (
        <div className="flex flex-col">
          <span className="font-medium">₹{price.toFixed(2)}</span>
          {mrp > price && (
            <div className="flex items-center space-x-1">
              <span className="text-xs opacity-60 line-through">
                ₹{mrp.toFixed(2)}
              </span>
              <span className="text-xs text-success group-hover:text-success-content">
                {discountPercent}% off
              </span>
            </div>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number;
      return (
        <div className="flex items-center space-x-2">
          <span
            className={
              stock > 0
                ? 'text-success group-hover:text-success-content'
                : 'text-error group-hover:text-error-content'
            }
          >
            {stock}
          </span>
          {stock <= 5 && stock > 0 && (
            <div className="badge badge-warning badge-sm">Low</div>
          )}
          {stock === 0 && <div className="badge badge-error badge-sm">Out</div>}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col space-y-1">
          <div
            className={`badge ${product.isActive ? 'badge-success' : 'badge-error'}`}
          >
            {product.isActive ? 'Active' : 'Inactive'}
          </div>
          {product.featured && (
            <div className="badge badge-primary badge-sm">Featured</div>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const createdAt = row.getValue('createdAt') as string;
      return createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A';
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="flex items-center space-x-2">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(product);
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
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
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product);
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

// Default columns without actions
export const productColumns = createProductColumns();
