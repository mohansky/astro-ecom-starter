import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../react-ui/Modal';
import { Button } from '../react-ui/Button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  productId?: string;
  productName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  productId,
  productName,
  onClose,
  onSuccess
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!productId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Product deleted successfully!');

        // Reload products table
        if (window.loadProducts) {
          window.loadProducts(
            window.currentProductSearch || '',
            window.currentProductCategory || '',
            window.productsPagination?.offset || 0
          );
        }

        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title="Confirm Delete"
      size="sm"
    >
      <div className="py-4">
        <p className="mb-4">
          Are you sure you want to delete {productName ? `"${productName}"` : 'this product'}?
          This action cannot be undone.
        </p>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="error"
            onClick={handleDelete}
            loading={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}