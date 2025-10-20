import React, { useState, useEffect, useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '../react-ui/Input';
import { Textarea } from '../react-ui/Textarea';
import { Button } from '../react-ui/Button';
import { Checkbox } from '../react-ui/Checkbox';
import { ProductImagesUpload } from './ProductImagesUpload';
import {
  productFormSchema,
  defaultProductFormValues,
  type ProductFormSchema,
} from '../../types/product-validation';
import {
  saveProductAction,
  type ProductActionState,
} from '../../actions/product-actions';
import type { Product } from '../../types/product';

interface ProductFormProps {
  productId?: string;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

export function ProductForm({
  productId,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Initialize form with React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultProductFormValues,
  });

  // Initialize action state for form submission
  const initialActionState: ProductActionState = {
    success: false,
  };

  const [actionState, formAction, isPending] = useActionState(
    saveProductAction,
    initialActionState
  );

  // Watch form values for reactive updates
  const watchedValues = watch();

  // Load product data if editing, reset form if adding new product
  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    } else {
      // Reset form for new product
      reset(defaultProductFormValues);
    }
  }, [productId, reset]);

  const loadProduct = async (id: string) => {
    try {
      setIsLoadingProduct(true);
      const response = await fetch(`/api/products?id=${id}`);
      const data = await response.json();

      console.log('API Response:', data); // Debug log

      if (data.success && data.products && data.products.length > 0) {
        const product = data.products[0]; // API returns array in products field
        const productData: ProductFormSchema = {
          name: product.name || '',
          slug: product.slug || '',
          sku: product.sku || '',
          description: product.description || '',
          category: product.category || '',
          subcategory: product.subcategory || '',
          price: Number(product.price) || 0,
          mrp: Number(product.mrp) || 0,
          stock: Number(product.stock) || 0,
          weight: Number(product.weight) || 0,
          gstPercentage: Number(product.gstPercentage) || 5,
          taxInclusive: Boolean(product.taxInclusive),
          dimensions: product.dimensions || '',
          mainImage: product.mainImage || '',
          images: product.images || [],
          tags: product.tags || '',
          isActive: Boolean(product.isActive),
          featured: Boolean(product.featured),
        };
        reset(productData);
      } else if (data.success && data.product) {
        // Fallback if API returns single product in product field
        const product = data.product;
        const productData: ProductFormSchema = {
          name: product.name || '',
          slug: product.slug || '',
          sku: product.sku || '',
          description: product.description || '',
          category: product.category || '',
          subcategory: product.subcategory || '',
          price: Number(product.price) || 0,
          mrp: Number(product.mrp) || 0,
          stock: Number(product.stock) || 0,
          weight: Number(product.weight) || 0,
          gstPercentage: Number(product.gstPercentage) || 5,
          taxInclusive: Boolean(product.taxInclusive),
          dimensions: product.dimensions || '',
          mainImage: product.mainImage || '',
          images: product.images || [],
          tags: product.tags || '',
          isActive: Boolean(product.isActive),
          featured: Boolean(product.featured),
        };
        reset(productData);
      } else {
        console.error('Product not found or invalid response structure:', data);
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Handle images change from unified component
  const handleImagesChange = (images: string[], mainImage: string) => {
    setValue('images', images);
    setValue('mainImage', mainImage);
  };

  // Handle action state changes (success/error)
  useEffect(() => {
    if (actionState.success) {
      // Show toast message with Sonner
      const message =
        actionState.message ||
        (productId
          ? 'Product updated successfully!'
          : 'Product created successfully!');
      toast.success(message);

      // Reload products table
      if (window.loadProducts) {
        window.loadProducts(
          window.currentProductSearch || '',
          window.currentProductCategory || '',
          window.productsPagination?.offset || 0
        );
      }

      // Call success callback to close modal
      onSuccess(actionState.product || ({ id: productId || 'new' } as any));
    }
  }, [actionState, onSuccess, productId]);

  // Form submission handler
  const onSubmit = async (data: ProductFormSchema) => {
    const formDataWithId = {
      ...data,
      id: productId,
    };
    formAction(formDataWithId);
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Display action errors */}
      {actionState.message && !actionState.success && (
        <div className="alert alert-error">
          <span>{actionState.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Name with Active/Featured checkboxes row */}
        <Input
          label="Name *"
          {...register('name')}
          error={errors.name?.message || actionState.errors?.name}
          containerClassName="sm:col-span-2 lg:col-span-2"
          required
        />

        <div className="flex gap-4">
          <Checkbox label="Active" {...register('isActive')} />
          <Checkbox label="Featured" {...register('featured')} />
        </div>

        {/* Slug and SKU row */}
        <Input
          label="Slug"
          helperText="(Auto-generated if empty)"
          {...register('slug')}
          error={errors.slug?.message || actionState.errors?.slug}
          placeholder="Auto-generated from name"
        />

        <Input
          label="SKU"
          helperText="(Auto-generated if empty)"
          {...register('sku')}
          error={errors.sku?.message || actionState.errors?.sku}
          placeholder="Auto-generated from name + category + ID"
        />

        {/* Product images full row */}
        <div className="sm:col-span-2 lg:col-span-3">
          <ProductImagesUpload
            onImagesChange={handleImagesChange}
            currentImages={watchedValues.images}
            currentMainImage={watchedValues.mainImage}
            productSlug={watchedValues.slug || ''}
            productName={watchedValues.name}
            maxImages={5}
          />
        </div>

        {/* Category, Subcategory, Tags row */}
        <Input
          label="Category *"
          {...register('category')}
          error={errors.category?.message || actionState.errors?.category}
          required
        />

        <Input
          label="Subcategory"
          {...register('subcategory')}
          error={errors.subcategory?.message || actionState.errors?.subcategory}
        />

        <Input
          label="Tags"
          {...register('tags')}
          error={errors.tags?.message || actionState.errors?.tags}
          placeholder="comma,separated,tags"
        />

        {/* Price, MRP, GST row */}
        <Input
          label="Price *"
          type="number"
          step="0.01"
          {...register('price', { valueAsNumber: true })}
          error={errors.price?.message || actionState.errors?.price}
          required
        />

        <Input
          label="MRP (optional)"
          type="number"
          step="0.01"
          min="0"
          {...register('mrp', { valueAsNumber: true })}
          error={errors.mrp?.message || actionState.errors?.mrp}
        />

        <div className="form-control">
          <Input
            label="GST Percentage (%)"
            type="number"
            step="0.01"
            {...register('gstPercentage', { valueAsNumber: true })}
            error={
              errors.gstPercentage?.message || actionState.errors?.gstPercentage
            }
            required
          />
          <label className="label cursor-pointer mt-1">
            <span className="label-text">Price includes tax</span>
            <input
              type="checkbox"
              className="checkbox"
              {...register('taxInclusive')}
            />
          </label>
        </div>

        {/* Stock, Weight, Dimensions row */}
        <Input
          label="Stock"
          type="number"
          {...register('stock', { valueAsNumber: true })}
          error={errors.stock?.message || actionState.errors?.stock}
        />

        <Input
          label="Weight (grams)"
          type="number"
          step="0.01"
          {...register('weight', { valueAsNumber: true })}
          error={errors.weight?.message || actionState.errors?.weight}
        />

        <Input
          label="Dimensions"
          {...register('dimensions')}
          error={errors.dimensions?.message || actionState.errors?.dimensions}
        />

        {/* Description full row */}
        <Textarea
          label="Description"
          {...register('description')}
          error={errors.description?.message || actionState.errors?.description}
          rows={3}
          className="sm:col-span-2 lg:col-span-3"
        />
      </div>

      <div className="modal-action flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="ghost"
          className="order-2 sm:order-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting || isPending}
          className="order-1 sm:order-2"
        >
          {productId ? 'Update Product' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}
