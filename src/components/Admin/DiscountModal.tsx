import React from 'react';
import { Modal } from '../react-ui/Modal';
import { DiscountForm } from './DiscountForm';
import type { Discount } from '../../types/discount';

interface DiscountModalProps {
  isOpen: boolean;
  discountId?: number;
  onClose: () => void;
  onSuccess: (discount: Discount) => void;
}

export function DiscountModal({ isOpen, discountId, onClose, onSuccess }: DiscountModalProps) {
  const title = discountId ? 'Edit Discount Code' : 'Add New Discount Code';

  const handleSuccess = (discount: Discount) => {
    onSuccess(discount);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <DiscountForm
        discountId={discountId}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}