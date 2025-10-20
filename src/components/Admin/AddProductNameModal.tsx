import React, { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '../react-ui/Input';
import { Button } from '../react-ui/Button';

interface AddProductNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (productId: string) => void;
}

export function AddProductNameModal({ isOpen, onClose, onSuccess }: AddProductNameModalProps) {
  const [productName, setProductName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a minimal product with just the name
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName.trim(),
          category: 'Uncategorized',
          price: 0,
          mrp: 0,
          stock: 0,
          isActive: false, // Set as inactive by default until user completes setup
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create product');
      }

      toast.success('Product created! Redirecting to product page...');

      // Reset form
      setProductName('');
      onClose();

      // Call success callback with product ID
      onSuccess(data.product.id);
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setProductName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleClose}
      />

      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-bold mb-4">Add New Product</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Product Name *"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              required
              autoFocus
              disabled={isSubmitting}
            />

            <p className="text-sm text-gray-600">
              You'll be able to add more details on the product page.
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
              >
                Add Product
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
