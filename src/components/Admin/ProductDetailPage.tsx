import React, { useState, useEffect, useActionState, startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '../react-ui/Input';
import { Textarea } from '../react-ui/Textarea';
import { Button } from '../react-ui/Button';
import { Checkbox } from '../react-ui/Checkbox';
import { ImageUpload } from './ImageUpload';
import { MainImageUpload } from './MainImageUpload';
import { DeleteConfirmModal } from './DeleteConfirmModal';
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

interface ProductDetailPageProps {
  productId: string;
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productData, setProductData] = useState<Product | null>(null);

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
  const price = watchedValues.price || 0;
  const mrp = watchedValues.mrp || 0;

  // Calculate discount percentage
  const discountPercent = mrp > 0 && price > 0 && price < mrp
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  // Load product data
  useEffect(() => {
    loadProduct(productId);
  }, [productId]);

  const loadProduct = async (id: string) => {
    try {
      setIsLoadingProduct(true);
      const response = await fetch(`/api/products?id=${id}`);
      const data = await response.json();

      if (data.success && data.products && data.products.length > 0) {
        const product = data.products[0];
        setProductData(product);
        const productFormData: ProductFormSchema = {
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
        reset(productFormData);
      } else {
        console.error('Product not found or invalid response structure:', data);
        toast.error('Product not found');
        window.location.href = '/admin/products';
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Handle main image upload/removal
  const handleMainImageUploaded = (imagePath: string, imageUrl: string) => {
    setValue('mainImage', imagePath);
  };

  const handleMainImageRemoved = () => {
    setValue('mainImage', '');
  };

  // Handle additional images upload/removal (BULK REPLACE)
  const handleImagesUploaded = (newImages: string[], imageUrls: string[]) => {
    // Replace ALL additional images with the new ones
    setValue('images', newImages);
  };

  const handleImageRemoved = (index: number) => {
    const currentImages = watchedValues.images || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue('images', newImages);
  };

  // Handle action state changes (success/error)
  useEffect(() => {
    console.log('Action state changed:', actionState); // Debug log

    if (actionState.success) {
      toast.dismiss(); // Dismiss loading toast
      toast.success(actionState.message || 'Product updated successfully!');
      // Reload product data to show updated values
      loadProduct(productId);
    } else if (actionState.message && !actionState.success) {
      toast.dismiss(); // Dismiss loading toast
      toast.error(actionState.message);
    } else if (actionState.errors) {
      toast.dismiss(); // Dismiss loading toast
      // Handle validation errors
      const errorMessages = Object.values(actionState.errors).filter(Boolean);
      if (errorMessages.length > 0) {
        toast.error(`Validation errors: ${errorMessages.join(', ')}`);
      }
    }
  }, [actionState, productId]);

  // Form submission handler
  const onSubmit = async (data: ProductFormSchema) => {
    console.log('Form submitted with data:', data); // Debug log

    const formDataWithId = {
      ...data,
      id: productId,
    };

    // Show immediate feedback toast
    toast.loading('Updating product...');

    try {
      startTransition(() => {
        formAction(formDataWithId);
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to update product');
    }
  };

  // Delete handlers
  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    // Navigate to products list
    window.location.href = '/admin/products';
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-4">Product not found</h2>
        <a href="/admin/products" className="btn btn-primary">
          Back to Products
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{productData.name}</h1>
          <p className="text-sm text-gray-600 mt-1">Product ID: {productData.id}</p>
        </div>
        <a href="/admin/products" className="btn btn-ghost">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Products
        </a>
      </div>

      {/* Meta Information Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4">Meta Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat">
                  <div className="stat-title">Status</div>
                  <div className="flex items-center gap-2">
                    <div className={`badge ${productData.isActive ? 'badge-success' : 'badge-error'}`}>
                      {productData.isActive ? 'Active' : 'Inactive'}
                    </div>
                    {productData.featured && (
                      <div className="badge badge-primary">Featured</div>
                    )}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Current SKU</div>
                  <div className="stat-value text-sm">{productData.sku || 'Not set'}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Created</div>
                  <div className="stat-value text-sm">
                    {productData.createdAt ? new Date(productData.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Updated</div>
                  <div className="stat-value text-sm">
                    {productData.updatedAt ? new Date(productData.updatedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2">
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat">
                  <div className="stat-title">Price</div>
                  <div className="stat-value text-lg">₹{price.toFixed(2)}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Stock</div>
                  <div className="stat-value text-lg">{watchedValues.stock || 0}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Category</div>
                  <div className="stat-value text-sm">{productData.category}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Discount</div>
                  <div className="stat-value text-lg">{discountPercent}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Display action errors */}
        {actionState.message && !actionState.success && (
          <div className="alert alert-error">
            <span>{actionState.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 card bg-base-200 shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Name *"
                  {...register('name')}
                  error={errors.name?.message || actionState.errors?.name}
                  containerClassName="sm:col-span-2"
                  required
                />

                <Input
                  label="Slug"
                  helperText="(Auto-generated if empty)"
                  {...register('slug')}
                  error={errors.slug?.message || actionState.errors?.slug}
                />

                <Input
                  label="SKU"
                  helperText="(Auto-generated if empty)"
                  {...register('sku')}
                  error={errors.sku?.message || actionState.errors?.sku}
                />

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
                  containerClassName="sm:col-span-2"
                />

                <div className="sm:col-span-2 flex gap-4">
                  <Checkbox label="Active" {...register('isActive')} />
                  <Checkbox label="Featured" {...register('featured')} />
                </div>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="lg:col-span-2 card bg-base-200 shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4">Product Images</h3>

              {/* Main Product Image */}
              <MainImageUpload
                onImageUploaded={handleMainImageUploaded}
                onImageRemoved={handleMainImageRemoved}
                currentImage={watchedValues.mainImage}
                productName={watchedValues.name}
                className="mb-6"
              />

              {/* Additional Images */}
              <ImageUpload
                onImagesUploaded={handleImagesUploaded}
                onImageRemoved={handleImageRemoved}
                currentImages={watchedValues.images}
                productName={watchedValues.name}
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="lg:col-span-2 card bg-base-200 shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4">Pricing & Inventory</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Price *"
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  error={errors.price?.message || actionState.errors?.price}
                  required
                />

                <Input
                  label="MRP"
                  type="number"
                  step="0.01"
                  {...register('mrp', { valueAsNumber: true })}
                  error={errors.mrp?.message || actionState.errors?.mrp}
                />

                <Input
                  label="Stock"
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  error={errors.stock?.message || actionState.errors?.stock}
                />

                <Input
                  label="GST Percentage (%)"
                  type="number"
                  step="0.01"
                  {...register('gstPercentage', { valueAsNumber: true })}
                  error={errors.gstPercentage?.message || actionState.errors?.gstPercentage}
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

                <div className="sm:col-span-2">
                  <label className="label cursor-pointer justify-start">
                    <input
                      type="checkbox"
                      className="checkbox mr-2"
                      {...register('taxInclusive')}
                    />
                    <span className="label-text">Price includes tax</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="lg:col-span-2 card bg-base-200 shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4">Description</h3>
              <Textarea
                label="Description"
                {...register('description')}
                error={errors.description?.message || actionState.errors?.description}
                rows={6}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button
            type="button"
            variant="error"
            onClick={() => setShowDeleteModal(true)}
            className="order-2 sm:order-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Product
          </Button>

          <Button
            type="submit"
            loading={isSubmitting || isPending}
            className="order-1 sm:order-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        productId={productId}
        productName={productData.name}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}