import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../react-ui/Button';
import { Modal } from '../react-ui/Modal';

interface StatusUpdateFormData {
  status: string;
  notes: string;
}

interface StatusUpdateModalProps {
  orderId: string | number;
  currentStatus: string;
  onSuccess?: () => void;
  refreshPage?: boolean; // Optional prop to control page refresh
  autoOpen?: boolean; // Optional prop to auto-open modal
}

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function StatusUpdateModal({
  orderId,
  currentStatus,
  onSuccess,
  refreshPage = true,
  autoOpen = false,
}: StatusUpdateModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StatusUpdateFormData>({
    defaultValues: {
      status: currentStatus,
      notes: '',
    },
  });

  const onSubmit = async (data: StatusUpdateFormData) => {
    if (data.status === currentStatus && !data.notes.trim()) {
      toast.warning('Please select a different status or add notes to update');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: data.status,
          notes: data.notes.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update order status');
      }

      if (result.success) {
        toast.success('Order status updated successfully!');
        modalRef.current?.close();
        reset();
        onSuccess?.();

        // Optionally refresh the page to show updated data
        if (refreshPage) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        throw new Error(result.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update order status'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    modalRef.current?.close();
    reset();
  };

  const handleOpen = () => {
    modalRef.current?.showModal();
  };

  // Auto-open modal if autoOpen prop is true
  React.useEffect(() => {
    if (autoOpen) {
      handleOpen();
    }
  }, [autoOpen]);

  return (
    <>
      {!autoOpen && (
        <Button
          onClick={handleOpen}
          className="btn btn-primary btn-lg"
        >
          Update Status
        </Button>
      )}

      <dialog ref={modalRef} className="modal">
        <div className="modal-box w-full max-w-lg mx-4 md:max-w-2xl md:w-11/12 max-h-[90vh] overflow-y-auto">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={handleClose}>
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg mb-6 pr-8">Update Order Status</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">New Status</span>
            </label>
            <select
              {...register('status', { required: 'Please select a status' })}
              className={`select select-bordered w-full ${
                errors.status ? 'select-error' : ''
              }`}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            {errors.status && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.status.message}
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Notes (Optional)</span>
            </label>
            <textarea
              {...register('notes')}
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder="Optional notes about this status change..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </form>
        </div>
      </dialog>
    </>
  );
}
