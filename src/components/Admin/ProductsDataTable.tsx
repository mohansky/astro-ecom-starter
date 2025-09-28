import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DataTable } from '../react-ui/DataTable';
import { createProductColumns } from '../columns/product-columns';
import { ProductModal } from './ProductModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import type { Product } from '../../types/product';

interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  categories: string[];
  error?: string;
}

interface ProductsDataTableProps {
  r2BucketUrl?: string;
}

export function ProductsDataTable({ r2BucketUrl }: ProductsDataTableProps = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<{id: string, name: string} | null>(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (search?: string, category?: string, offset = 0) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
        // Don't set isActive parameter to show ALL products (active and inactive) in admin panel
      });

      if (search?.trim()) {
        params.set('search', search.trim());
      }

      if (category?.trim()) {
        params.set('category', category.trim());
      }

      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: ProductsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load products');
      }

      setProducts(data.products || []);

      // Update global variables for backward compatibility
      if (typeof window !== 'undefined') {
        window.currentProductSearch = search || '';
        window.currentProductCategory = category || '';
        window.productsPagination = data.pagination;
      }

    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProductId(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setIsModalOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    window.location.href = `/admin/products/${product.id}`;
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct({ id: product.id, name: product.name });
    setShowDeleteModal(true);
  };

  const handleProductSaved = (product: Product) => {
    setIsModalOpen(false);
    setEditingProductId(undefined);
    // Reload the products to show updated data
    loadProducts();
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setDeletingProduct(null);
    // Reload the products to show updated data
    loadProducts();
  };

  const handleRowClick = (product: Product) => {
    handleViewProduct(product);
  };

  // Expose loadProducts globally for backward compatibility
  useEffect(() => {
    window.loadProducts = loadProducts;
    return () => {
      if (window.loadProducts) {
        window.loadProducts = undefined;
      }
    };
  }, []);

  const columns = createProductColumns({
    onEdit: handleEditProduct,
    onDelete: handleDeleteProduct,
    onView: handleViewProduct,
    r2BucketUrl,
  });

  const renderMobileCard = (product: Product, index: number) => {
    const imageUrl = product.imagePath
      ? `${r2BucketUrl}/products/${product.imagePath}/${product.imagePath}.jpg`
      : '/placeholder-product.jpg';

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
                  target.src = '/placeholder-product.jpg';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-2">{product.name}</h3>
              <p className="text-sm opacity-60">{product.sku}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`badge ${product.isActive ? 'badge-success' : 'badge-error'}`}>
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
                <p className="font-bold text-primary">₹{finalPrice.toFixed(2)}</p>
                {product.price !== product.mrp && (
                  <p className="text-xs line-through opacity-60">₹{product.mrp.toFixed(2)}</p>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium opacity-70">GST:</span>
              <p className="mt-1">{product.gstPercentage}% {product.taxInclusive ? '(Incl.)' : '(Excl.)'}</p>
            </div>
            {product.description && (
              <div className="col-span-2">
                <span className="font-medium opacity-70">Description:</span>
                <p className="mt-1 text-sm line-clamp-2">{product.description}</p>
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

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex gap-2">
          <button
            onClick={handleAddProduct}
            className="btn btn-primary"
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
            Add Product
          </button>
          <button
            onClick={() => {
              const modal = document.getElementById('csvModal') as HTMLDialogElement;
              modal?.showModal();
            }}
            className="btn btn-secondary"
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Upload CSV
          </button>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={products}
        searchKey="name"
        searchPlaceholder="Search products by name, description, or category..."
        loading={loading}
        onRowClick={handleRowClick}
        onRefresh={() => loadProducts()}
        showRefresh={true}
        refreshDisabled={loading}
        refreshText="Refresh"
        renderMobileCard={renderMobileCard}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        productId={editingProductId}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProductId(undefined);
        }}
        onSuccess={handleProductSaved}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          productId={deletingProduct.id}
          productName={deletingProduct.name}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingProduct(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}