import React, { useState, useEffect } from 'react';
import { ProductModal } from './ProductModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { toast } from 'sonner';
import type { Product } from '../../types/product';

interface ProductManagerProps {
  onProductSaved?: (product: Product) => void;
}

export function ProductManager({ onProductSaved }: ProductManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | undefined>();
  const [deletingProduct, setDeletingProduct] = useState<{id: string, name: string} | null>(null);

  const handleOpenModal = (productId?: string) => {
    setEditingProductId(productId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProductId(undefined);
  };

  const handleProductSaved = (product: Product) => {
    onProductSaved?.(product);
    // Note: Toast messages and table refresh are now handled in ProductForm
    // to avoid duplicate notifications and refresh calls
  };


  // Expose functions globally so vanilla JS can call them
  React.useEffect(() => {
    window.openProductModal = handleOpenModal;
    return () => {
      if (window.openProductModal) {
        window.openProductModal = undefined;
      }
    };
  }, []);

  return (
    <>
      <ProductModal
        isOpen={isModalOpen}
        productId={editingProductId}
        onClose={handleCloseModal}
        onSuccess={handleProductSaved}
      />
    </>
  );
}

// Extend window type for TypeScript
declare global {
  interface Window {
    openProductModal?: (productId?: string) => void;
    toastManager?: any;
    loadProducts?: any;
    currentProductSearch?: string;
    currentProductCategory?: string;
    productsPagination?: any;
  }
}
