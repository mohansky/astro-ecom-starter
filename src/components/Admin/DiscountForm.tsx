import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '../react-ui/Input';
import { Textarea } from '../react-ui/Textarea';
import { Button } from '../react-ui/Button';
import { Checkbox } from '../react-ui/Checkbox';
import type { Discount } from '../../types/discount';

// Validation schema for discount form
const discountFormSchema = z.object({
  code: z.string().min(1, 'Discount code is required').toUpperCase(),
  description: z.string().min(1, 'Description is required'),
  discountType: z.enum(['percentage', 'fixed'], {
    required_error: 'Discount type is required',
  }),
  discountValue: z.coerce.number().min(0, 'Discount value must be positive'),
  minimumOrderAmount: z.coerce.number().min(0, 'Minimum order amount must be positive'),
  maxDiscountAmount: z.coerce.number().min(0).nullable().optional(),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validTo: z.string().min(1, 'Valid to date is required'),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
});

type DiscountFormSchema = z.infer<typeof discountFormSchema>;

const defaultDiscountFormValues: DiscountFormSchema = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  minimumOrderAmount: 0,
  maxDiscountAmount: null,
  validFrom: new Date().toISOString().split('T')[0],
  validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  usageLimit: null,
  isActive: true,
};

interface DiscountFormProps {
  discountId?: number;
  onSuccess: (discount: Discount) => void;
  onCancel: () => void;
}

export function DiscountForm({ discountId, onSuccess, onCancel }: DiscountFormProps) {
  const [isLoadingDiscount, setIsLoadingDiscount] = useState(false);

  // Initialize form with React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DiscountFormSchema>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: defaultDiscountFormValues,
  });

  // Watch form values
  const discountType = watch('discountType');

  // Load discount data if editing
  useEffect(() => {
    if (discountId) {
      loadDiscount(discountId);
    } else {
      reset(defaultDiscountFormValues);
    }
  }, [discountId, reset]);

  const loadDiscount = async (id: number) => {
    try {
      setIsLoadingDiscount(true);
      const response = await fetch(`/api/discounts/${id}`);
      const data = await response.json();

      if (data.success && data.coupon) {
        const discount = data.coupon;
        const discountData: DiscountFormSchema = {
          code: discount.code || '',
          description: discount.description || '',
          discountType: discount.discountType || 'percentage',
          discountValue: Number(discount.discountValue) || 0,
          minimumOrderAmount: Number(discount.minimumOrderAmount) || 0,
          maxDiscountAmount: discount.maxDiscountAmount ? Number(discount.maxDiscountAmount) : null,
          validFrom: discount.validFrom ? discount.validFrom.split('T')[0] : '',
          validTo: discount.validTo ? discount.validTo.split('T')[0] : '',
          usageLimit: discount.usageLimit ? Number(discount.usageLimit) : null,
          isActive: Boolean(discount.isActive),
        };

        reset(discountData);
      } else {
        toast.error('Failed to load discount details');
        onCancel();
      }
    } catch (error) {
      console.error('Error loading discount:', error);
      toast.error('Failed to load discount details');
      onCancel();
    } finally {
      setIsLoadingDiscount(false);
    }
  };

  const onSubmit = async (data: DiscountFormSchema) => {
    try {
      const isEdit = !!discountId;
      const url = isEdit ? `/api/discounts/${discountId}` : '/api/discounts';
      const method = isEdit ? 'PUT' : 'POST';

      // Prepare data for submission
      const submitData = {
        ...data,
        maxDiscountAmount: data.maxDiscountAmount || null,
        usageLimit: data.usageLimit || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Discount ${isEdit ? 'updated' : 'created'} successfully!`);
        onSuccess(result.coupon);
      } else {
        throw new Error(result.error || 'Failed to save discount');
      }
    } catch (error) {
      console.error('Error saving discount:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save discount');
    }
  };

  if (isLoadingDiscount) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Discount Code */}
        <div className="form-control">
          <label className="label" htmlFor="code">
            <span className="label-text">Discount Code</span>
          </label>
          <Input
            id="code"
            placeholder="e.g., SAVE20"
            className="uppercase"
            error={errors.code?.message}
            {...register('code', {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase();
              },
            })}
          />
        </div>

        {/* Discount Type */}
        <div className="form-control">
          <label className="label" htmlFor="discountType">
            <span className="label-text">Discount Type</span>
          </label>
          <select
            id="discountType"
            className={`select select-bordered w-full ${errors.discountType ? 'select-error' : ''}`}
            {...register('discountType')}
          >
            <option value="">Select type</option>
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
          {errors.discountType && (
            <p className="text-error text-sm mt-1">{errors.discountType.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="form-control">
        <label className="label" htmlFor="description">
          <span className="label-text">Description</span>
        </label>
        <Textarea
          id="description"
          rows={2}
          placeholder="Brief description of the discount"
          error={errors.description?.message}
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Discount Value */}
        <div className="form-control">
          <label className="label" htmlFor="discountValue">
            <span className="label-text">
              Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
            </span>
          </label>
          <Input
            id="discountValue"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter value"
            error={errors.discountValue?.message}
            {...register('discountValue')}
          />
        </div>

        {/* Minimum Order Amount */}
        <div className="form-control">
          <label className="label" htmlFor="minimumOrderAmount">
            <span className="label-text">Minimum Order Amount (₹)</span>
          </label>
          <Input
            id="minimumOrderAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            error={errors.minimumOrderAmount?.message}
            {...register('minimumOrderAmount')}
          />
        </div>
      </div>

      {/* Maximum Discount Amount */}
      <div className="form-control">
        <label className="label" htmlFor="maxDiscountAmount">
          <span className="label-text">Maximum Discount Amount (₹) - Optional</span>
        </label>
        <Input
          id="maxDiscountAmount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Leave empty for no limit"
          error={errors.maxDiscountAmount?.message}
          {...register('maxDiscountAmount')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Valid From */}
        <div className="form-control">
          <label className="label" htmlFor="validFrom">
            <span className="label-text">Valid From</span>
          </label>
          <Input
            id="validFrom"
            type="date"
            error={errors.validFrom?.message}
            {...register('validFrom')}
          />
        </div>

        {/* Valid To */}
        <div className="form-control">
          <label className="label" htmlFor="validTo">
            <span className="label-text">Valid To</span>
          </label>
          <Input
            id="validTo"
            type="date"
            error={errors.validTo?.message}
            {...register('validTo')}
          />
        </div>
      </div>

      {/* Usage Limit */}
      <div className="form-control">
        <label className="label" htmlFor="usageLimit">
          <span className="label-text">Usage Limit - Optional</span>
        </label>
        <Input
          id="usageLimit"
          type="number"
          min="1"
          placeholder="Leave empty for unlimited usage"
          error={errors.usageLimit?.message}
          {...register('usageLimit')}
        />
      </div>

      {/* Active Status */}
      <div className="form-control">
        <label className="cursor-pointer label justify-start gap-3">
          <Checkbox {...register('isActive')} />
          <span className="label-text">Active Status</span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {isSubmitting ? 'Saving...' : discountId ? 'Update Discount' : 'Create Discount'}
        </Button>
      </div>
    </form>
  );
}