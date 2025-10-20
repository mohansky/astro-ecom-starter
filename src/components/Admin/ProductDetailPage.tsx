import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '../react-ui/Input';
import { Textarea } from '../react-ui/Textarea';
import { Button } from '../react-ui/Button';
import { Checkbox } from '../react-ui/Checkbox';
import { ProductImagesUpload } from './ProductImagesUpload';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  productFormSchema,
  defaultProductFormValues,
  type ProductFormSchema,
} from '../../types/product-validation';
import type { Product } from '../../types/product';
import { generateSlug, generateSKU } from '../../lib/slug-utils';
import {
  useProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useProducts';
import { BackArrowIcon } from '../Icons/BackArrowIcon';
import { TrashIcon } from '../Icons/TrashIcon';
import { SaveIcon } from '../Icons/SaveIcon';
import { QueryProvider } from '@/providers/QueryProvider';

interface ProductDetailPageProps {
  productId: string;
}

function ProductDetailPageContent({ productId }: ProductDetailPageProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [originalName, setOriginalName] = useState<string>('');

  // React Query hooks
  const {
    data: productData,
    isLoading: isLoadingProduct,
    error,
  } = useProduct(productId);
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Initialize form with React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormSchema>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultProductFormValues,
  });

  // Watch form values for reactive updates
  const watchedValues = watch();
  const price = watchedValues.price || 0;
  const mrp = watchedValues.mrp || 0;

  // Calculate discount percentage
  const discountPercent =
    mrp > 0 && price > 0 && price < mrp
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;

  // Load product data into form when fetched
  useEffect(() => {
    if (productData) {
      console.log(
        '[ProductDetailPage] Loading product data into form:',
        productData.name,
        productData.slug
      );
      setOriginalName(productData.name || ''); // Save original name
      const productFormData: ProductFormSchema = {
        name: productData.name || '',
        slug: productData.slug || '',
        sku: productData.sku || '',
        description: productData.description || '',
        category: productData.category || '',
        subcategory: productData.subcategory || '',
        price: Number(productData.price) || 0,
        mrp: Number(productData.mrp) || 0,
        stock: Number(productData.stock) || 0,
        weight: Number(productData.weight) || 0,
        gstPercentage: Number(productData.gstPercentage) || 5,
        taxInclusive: Boolean(productData.taxInclusive),
        dimensions: productData.dimensions || '',
        mainImage: productData.mainImage || '',
        images: productData.images || [],
        tags: productData.tags || '',
        isActive: Boolean(productData.isActive),
        featured: Boolean(productData.featured),
      };
      reset(productFormData);
    }
  }, [productData, reset]);

  // Handle error state
  useEffect(() => {
    if (error) {
      console.error('Error loading product:', error);
      toast.error('Product not found');
      window.location.href = '/admin/products';
    }
  }, [error]);

  // Handle images change from unified component
  const handleImagesChange = useCallback(
    (images: string[], mainImage: string) => {
      setValue('images', images);
      setValue('mainImage', mainImage);
    },
    [setValue]
  );

  // Form submission handler
  const onSubmit = async (data: ProductFormSchema) => {
    console.log('=== FORM SUBMIT START ===');
    console.log('Form data:', data);

    // Check if name has changed
    const nameChanged = data.name !== originalName;

    // Regenerate slug and SKU if name has changed
    let updatedData = { ...data };
    if (nameChanged) {
      updatedData.slug = generateSlug(data.name);
      updatedData.sku = generateSKU(data.name, data.category, productId);
      console.log(
        'Name changed - regenerated slug:',
        updatedData.slug,
        'and SKU:',
        updatedData.sku
      );
    }

    console.log('Updating product with mutation...');
    updateMutation.mutate(
      { id: productId, data: updatedData },
      {
        onSuccess: (updatedProduct) => {
          console.log('Product updated successfully:', updatedProduct);
          // Update original name for next comparison
          if (updatedProduct?.name) {
            setOriginalName(updatedProduct.name);
          }
          console.log('=== FORM SUBMIT END ===');
        },
        onError: (error) => {
          console.error('Update failed:', error);
          console.log('=== FORM SUBMIT END ===');
        },
      }
    );
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
          <p className="text-sm text-gray-600 mt-1">
            Product ID: {productData.id}
          </p>
        </div>
        <a href="/admin/products">
          <Button variant="outline" size="sm">
            <BackArrowIcon size={18} /> Back to Products
          </Button>
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
                    <div
                      className={`badge ${productData.isActive ? 'badge-success' : 'badge-error'}`}
                    >
                      {productData.isActive ? 'Active' : 'Inactive'}
                    </div>
                    {productData.featured && (
                      <div className="badge badge-primary">Featured</div>
                    )}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Current SKU</div>
                  <div className="stat-value text-sm">
                    {productData.sku || 'Not set'}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Created</div>
                  <div className="stat-value text-sm">
                    {productData.createdAt
                      ? new Date(productData.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Updated</div>
                  <div className="stat-value text-sm">
                    {productData.updatedAt
                      ? new Date(productData.updatedAt).toLocaleDateString()
                      : 'N/A'}
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
                  <div className="stat-value text-lg">
                    {watchedValues.stock || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Category</div>
                  <div className="stat-value text-sm">
                    {productData.category}
                  </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 card bg-base-200 shadow-sm">
            <div className="card-body">
              <h3 className="card-title mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Name *"
                  {...register('name')}
                  error={errors.name?.message}
                  containerClassName="sm:col-span-2"
                  required
                />

                <Input
                  label="Slug"
                  helperText="(Auto-generated if empty)"
                  {...register('slug')}
                  error={errors.slug?.message}
                />

                <Input
                  label="SKU"
                  helperText="(Auto-generated if empty)"
                  {...register('sku')}
                  error={errors.sku?.message}
                />

                <Input
                  label="Category *"
                  {...register('category')}
                  error={errors.category?.message}
                  required
                />

                <Input
                  label="Subcategory"
                  {...register('subcategory')}
                  error={errors.subcategory?.message}
                />

                <Input
                  label="Tags"
                  {...register('tags')}
                  error={errors.tags?.message}
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
              <ProductImagesUpload
                onImagesChange={handleImagesChange}
                currentImages={watchedValues.images}
                currentMainImage={watchedValues.mainImage}
                productSlug={watchedValues.slug || ''}
                productName={watchedValues.name}
                maxImages={5}
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
                  error={errors.price?.message}
                  required
                />

                <Input
                  label="MRP"
                  type="number"
                  step="0.01"
                  {...register('mrp', { valueAsNumber: true })}
                  error={errors.mrp?.message}
                />

                <Input
                  label="Stock"
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  error={errors.stock?.message}
                />

                <Input
                  label="GST Percentage (%)"
                  type="number"
                  step="0.01"
                  {...register('gstPercentage', { valueAsNumber: true })}
                  error={errors.gstPercentage?.message}
                />

                <Input
                  label="Weight (grams)"
                  type="number"
                  step="0.01"
                  {...register('weight', { valueAsNumber: true })}
                  error={errors.weight?.message}
                />

                <Input
                  label="Dimensions"
                  {...register('dimensions')}
                  error={errors.dimensions?.message}
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
                error={errors.description?.message}
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
            size="sm"
          >
            <TrashIcon size={18} /> Delete Product
          </Button>

          <Button
            type="submit"
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            className="order-1 sm:order-2"
            size="sm"
          >
            <SaveIcon size={18} /> Save Changes
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

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  return (
    <QueryProvider>
      <ProductDetailPageContent productId={productId} />
    </QueryProvider>
  );
}
