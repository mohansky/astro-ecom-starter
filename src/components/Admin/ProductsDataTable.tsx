import React, { useState } from 'react';
import { DataTable } from '../react-ui/DataTable';
import { createProductColumns } from '../columns/product-columns';
import { AddProductNameModal } from './AddProductNameModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useProducts, useDeleteProduct } from '@/hooks/useProducts';
import { useAdminUIStore } from '@/stores/adminUIStore';
import type { Product } from '@/types/product';
import { AddIcon } from '../Icons/AddIcon';
import { UploadIcon } from '../Icons/UploadIcon';
import Button from '../react-ui/Button';
import { QueryProvider } from '@/providers/QueryProvider';

interface ProductsDataTableProps {
  r2BucketUrl?: string;
}

function ProductsDataTableContent({
  r2BucketUrl,
}: ProductsDataTableProps = {}) {
  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Get UI state from Zustand store
  const {
    isAddProductModalOpen,
    isDeleteModalOpen,
    productSearch,
    productCategory,
    productLimit,
    productOffset,
    openAddProductModal,
    closeAddProductModal,
    openDeleteModal,
    closeDeleteModal,
  } = useAdminUIStore();

  // Fetch products with React Query
  const { data, isLoading, error, refetch } = useProducts({
    search: productSearch,
    category: productCategory,
    limit: productLimit,
    offset: productOffset,
  });

  // Delete mutation
  const deleteMutation = useDeleteProduct();

  const products = data?.products || [];

  const handleAddProduct = () => {
    openAddProductModal();
  };

  const handleProductCreated = (productId: string) => {
    window.location.href = `/admin/products/${productId}`;
  };

  const handleEditProduct = (product: Product) => {
    window.location.href = `/admin/products/${product.id}`;
  };

  const handleViewProduct = (product: Product) => {
    window.location.href = `/admin/products/${product.id}`;
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct({ id: product.id, name: product.name });
    openDeleteModal();
  };

  const handleDeleteSuccess = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id, {
        onSuccess: () => {
          closeDeleteModal();
          setDeletingProduct(null);
        },
      });
    }
  };

  const handleRowClick = (product: Product) => {
    handleViewProduct(product);
  };

  const columns = createProductColumns({
    onEdit: handleEditProduct,
    onDelete: handleDeleteProduct,
    onView: handleViewProduct,
    r2BucketUrl,
  });

  const renderMobileCard = (product: Product, index: number) => {
    const imageUrl =
      product.mainImage && product.slug
        ? `${r2BucketUrl}/products/${product.slug}/${product.mainImage}`
        : '/placeholder-product.svg';

    const finalPrice = product.taxInclusive
      ? product.price
      : product.price * (1 + product.gstPercentage / 100);

    return (
      <div
        className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleRowClick(product)}
      >
        <div className="card-body p-4">
          {/* Header with image and basic info */}
          <div className="flex items-start space-x-3 mb-3">
            <div className="w-16 h-16 rounded bg-base-200 overflow-hidden flex-shrink-0">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-product.svg';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-2">
                {product.name}
              </h3>
              <p className="text-sm opacity-60">{product.sku}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div
                  className={`badge ${product.isActive ? 'badge-success' : 'badge-error'}`}
                >
                  {product.isActive ? 'Active' : 'Inactive'}
                </div>
                {product.featured && (
                  <div className="badge badge-primary">Featured</div>
                )}
              </div>
            </div>
          </div>

          {/* Product details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium opacity-70">Category:</span>
              <p className="mt-1">{product.category}</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Stock:</span>
              <p className="mt-1 font-medium">{product.stock}</p>
            </div>
            <div>
              <span className="font-medium opacity-70">Price:</span>
              <div className="mt-1">
                <p className="font-bold text-primary">
                  ₹{finalPrice.toFixed(2)}
                </p>
                {product.price !== product.mrp && (
                  <p className="text-xs line-through opacity-60">
                    ₹{product.mrp.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium opacity-70">GST:</span>
              <p className="mt-1">
                {product.gstPercentage}%{' '}
                {product.taxInclusive ? '(Incl.)' : '(Excl.)'}
              </p>
            </div>
            {product.description && (
              <div className="col-span-2">
                <span className="font-medium opacity-70">Description:</span>
                <p className="mt-1 text-sm line-clamp-2">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-base-200">
            <button
              className="btn btn-sm btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEditProduct(product);
              }}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-error"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProduct(product);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show error state
  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading products: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAddProduct}>
            <AddIcon size={18} /> Add Product
          </Button>
          <Button
            size="sm"
            variant="accent"
            onClick={() => {
              const modal = document.getElementById(
                'csvModal'
              ) as HTMLDialogElement;
              modal?.showModal();
            }}
          >
            <UploadIcon size={18} /> Upload CSV
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={products}
        searchKey="name"
        searchPlaceholder="Search products by name, description, or category..."
        loading={isLoading}
        onRowClick={handleRowClick}
        onRefresh={() => {
          refetch();
        }}
        showRefresh={true}
        refreshDisabled={isLoading}
        refreshText="Refresh"
        renderMobileCard={renderMobileCard}
      />

      {/* Add Product Modal */}
      <AddProductNameModal
        isOpen={isAddProductModalOpen}
        onClose={closeAddProductModal}
        onSuccess={handleProductCreated}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          productId={deletingProduct.id}
          productName={deletingProduct.name}
          onClose={() => {
            closeDeleteModal();
            setDeletingProduct(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}

export function ProductsDataTable({
  r2BucketUrl,
}: ProductsDataTableProps = {}) {
  return (
    <QueryProvider>
      <ProductsDataTableContent r2BucketUrl={r2BucketUrl} />
    </QueryProvider>
  );
}
