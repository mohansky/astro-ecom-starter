import React from 'react';
import { Modal } from '../react-ui/Modal';
import { ProductForm } from './ProductForm';
import type { Product } from '../../types/product';

interface ProductModalProps {
  isOpen: boolean;
  productId?: string;
  onClose: () => void;
  onSuccess: (product: Product) => void;
}

export function ProductModal({ isOpen, productId, onClose, onSuccess }: ProductModalProps) {
  const title = productId ? 'Edit Product' : 'Add Product';

  const handleSuccess = (product: Product) => {
    onSuccess(product);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <ProductForm
        productId={productId}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}