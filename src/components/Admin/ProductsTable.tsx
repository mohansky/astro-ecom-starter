import React from 'react';
import { DataTable } from '../react-ui/DataTable';
import { createProductColumns } from '../columns/product-columns';
import type { Product } from '../../types/product';

interface ProductsTableProps {
  products: Product[];
  loading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
  onRowClick?: (product: Product) => void;
}

export function ProductsTable({
  products,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onRowClick,
}: ProductsTableProps) {
  const columns = createProductColumns({
    onEdit,
    onDelete,
    onView,
  });

  return (
    <DataTable
      columns={columns}
      data={products}
      searchKey="name"
      searchPlaceholder="Search products..."
      loading={loading}
      onRowClick={onRowClick}
    />
  );
}