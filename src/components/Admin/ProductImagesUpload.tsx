import React, { useState, useRef } from 'react';
import { Button } from '../react-ui/Button';
import { Modal } from '../react-ui/Modal';
import { TrashIcon } from '../Icons/TrashIcon';
import { StarIcon } from '../Icons/StarIcon';

interface ProductImagesUploadProps {
  onImagesChange: (images: string[], mainImage: string) => void;
  currentImages?: string[];
  currentMainImage?: string;
  productSlug: string;
  productName: string;
  maxImages?: number;
  className?: string;
}

interface ImageItem {
  filename: string;
  url: string;
  isUploading?: boolean;
}

export function ProductImagesUpload({
  onImagesChange,
  currentImages = [],
  currentMainImage,
  productSlug,
  productName,
  maxImages = 5,
  className = '',
}: ProductImagesUploadProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>(
    currentMainImage || ''
  );
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>(
    'info'
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // Initialize images from current data (only once on mount)
  React.useEffect(() => {
    if (!initializedRef.current && currentImages.length > 0 && productSlug) {
      console.log(
        '[ProductImagesUpload] Initializing with images:',
        currentImages
      );
      const r2BucketUrl = 'https://pub-67b76734f5b543b9925c0870089929bb.r2.dev';
      const imageItems: ImageItem[] = currentImages.map((filename) => ({
        filename,
        url: `${r2BucketUrl}/products/${productSlug}/${filename}`,
      }));
      setImages(imageItems);
      setFeaturedImage(currentMainImage || currentImages[0] || '');
      initializedRef.current = true;
    }
  }, [currentImages, currentMainImage, productSlug]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate max images count
    if (images.length + files.length > maxImages) {
      setUploadStatus(`Maximum ${maxImages} images allowed. You can upload ${maxImages - images.length} more image(s).`);
      setStatusType('error');
      return;
    }

    // Validate file sizes and types before uploading
    const errors: string[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type (only JPEG, PNG, and WebP allowed)`);
      } else if (file.size > maxSize) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        errors.push(`${file.name}: File too large (${sizeMB}MB, maximum is 5MB)`);
      }
    }

    if (errors.length > 0) {
      setUploadStatus(errors.join(' • '));
      setStatusType('error');
      return;
    }

    uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    if (!productName.trim()) {
      setUploadStatus('Please enter a product name first');
      setStatusType('error');
      return;
    }

    const shouldSetFeatured = images.length === 0 && !featuredImage;
    let uploadedCount = 0;

    // Add all placeholders at once (validation already done in handleFileSelect)
    const newPlaceholders: ImageItem[] = [];
    for (const file of files) {
      // Check if filename already exists
      const existingImage = images.find((img) => img.filename === file.name);
      if (existingImage) {
        const confirm = window.confirm(
          `Image "${file.name}" already exists. Replace it?`
        );
        if (!confirm) continue;
      }

      // Add placeholder with preview
      const previewUrl = URL.createObjectURL(file);
      newPlaceholders.push({
        filename: file.name,
        url: previewUrl,
        isUploading: true,
      });
    }

    // Add all placeholders at once
    setImages((prev) => {
      const filtered = prev.filter(
        (img) => !newPlaceholders.find((p) => p.filename === img.filename)
      );
      return [...filtered, ...newPlaceholders];
    });

    // Upload all files
    for (const file of files) {
      const placeholder = newPlaceholders.find((p) => p.filename === file.name);
      if (!placeholder) continue;

      try {
        setUploadStatus(`Uploading ${file.name}...`);
        setStatusType('info');

        const formData = new FormData();
        formData.append('image', file);
        formData.append('productName', productName.trim());
        formData.append('originalFilename', file.name);

        const response = await fetch('/api/products/upload-image', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success && result.url) {
          // Update with actual URL
          setImages((prev) =>
            prev.map((img) =>
              img.filename === file.name
                ? { ...img, url: result.url, isUploading: false }
                : img
            )
          );

          uploadedCount++;
          setUploadStatus(
            `Uploaded ${uploadedCount}/${newPlaceholders.length} images`
          );
          setStatusType('success');

          // Set as featured if it's the first image
          if (shouldSetFeatured && uploadedCount === 1) {
            setFeaturedImage(file.name);
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadStatus(`Failed to upload ${file.name}: ${error.message}`);
        setStatusType('error');

        // Remove failed upload
        setImages((prev) => prev.filter((img) => img.filename !== file.name));
      }
    }

    if (uploadedCount === newPlaceholders.length) {
      setUploadStatus(
        `Successfully uploaded ${uploadedCount} image${uploadedCount > 1 ? 's' : ''}!`
      );
      setStatusType('success');
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImageClick = (filename: string) => {
    setImageToDelete(filename);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;

    try {
      // Remove from state
      const newImages = images.filter((img) => img.filename !== imageToDelete);
      setImages(newImages);

      // If removing featured image, set new featured
      if (featuredImage === imageToDelete) {
        const newFeatured = newImages[0]?.filename || '';
        setFeaturedImage(newFeatured);
      }

      setUploadStatus(`${imageToDelete} removed`);
      setStatusType('info');
    } catch (error: any) {
      console.error('Remove error:', error);
      setUploadStatus(`Failed to remove ${imageToDelete}`);
      setStatusType('error');
    } finally {
      setIsDeleteModalOpen(false);
      setImageToDelete(null);
    }
  };

  const handleSetFeatured = (filename: string) => {
    setFeaturedImage(filename);
    setUploadStatus(`Set ${filename} as featured image`);
    setStatusType('success');
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    console.log('[ProductImagesUpload] Drag start:', index);
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(
      '[ProductImagesUpload] Drop at:',
      dropIndex,
      'from:',
      draggedIndex
    );

    if (draggedIndex === null) {
      console.log('[ProductImagesUpload] No dragged index, skipping');
      return;
    }

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    console.log(
      '[ProductImagesUpload] New order:',
      newImages.map((img) => img.filename)
    );
    setImages(newImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    console.log('[ProductImagesUpload] Drag end');
    setDraggedIndex(null);
  };

  // Notify parent of changes (only when not uploading to prevent flickering)
  React.useEffect(() => {
    // Don't notify if any images are still uploading
    const hasUploading = images.some((img) => img.isUploading);
    console.log(
      '[ProductImagesUpload] useEffect triggered - hasUploading:',
      hasUploading,
      'images count:',
      images.length
    );

    if (hasUploading) {
      console.log(
        '[ProductImagesUpload] Skipping notification - still uploading'
      );
      return;
    }

    const filenames = images.map((img) => img.filename);
    const main = featuredImage || filenames[0] || '';
    console.log(
      '[ProductImagesUpload] Notifying parent - filenames:',
      filenames,
      'main:',
      main
    );
    onImagesChange(filenames, main);
  }, [images, featuredImage, onImagesChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Product Images</h3>
          <ol className="list-decimal list-inside text-xs opacity-70">
            <li>
              Upload up to {maxImages} images. Each image must be less than 5MB.
            </li>
            <li>First image or selected image will be featured.</li>
            <li>
              Uploading a file with the same name will replace the existing one
            </li>
          </ol>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4  gap-4">
        {images.map((image, index) => (
          <div
            key={image.filename}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group border-2 rounded-lg overflow-hidden cursor-move transition-all ${
              featuredImage === image.filename
                ? 'border-primary ring-2 ring-primary'
                : 'border-base-300'
            } ${image.isUploading ? 'opacity-50' : ''} ${
              draggedIndex === index ? 'opacity-30' : ''
            }`}
          >
            {/* Image */}
            <div className="aspect-square bg-base-200">
              <img
                src={image.url}
                alt={image.filename}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Uploading Indicator */}
            {image.isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            )}

            {/* Action Buttons - Always Visible */}
            <div
              className="absolute top-0 left-0 w-full flex flex-row justify-between gap-1"
              onDragStart={(e) => e.stopPropagation()}
              onDragOver={(e) => e.stopPropagation()}
              onDrop={(e) => e.stopPropagation()}
            >
              {/* Star Button - Always visible, filled if featured */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    '[ProductImagesUpload] Set featured:',
                    image.filename
                  );
                  handleSetFeatured(image.filename);
                }}
                className="btn btn-ghost btn-xs"
                disabled={image.isUploading}
              >
                <StarIcon
                  size={16}
                  strokeWidth={1.5}
                  className={
                    featuredImage === image.filename
                      ? 'text-primary fill-primary'
                      : 'text-neutral'
                  }
                />
              </button>

              {/* Remove Button - Always visible */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    '[ProductImagesUpload] Remove clicked:',
                    image.filename
                  );
                  handleRemoveImageClick(image.filename);
                }}
                className="btn btn-ghost btn-xs"
                disabled={image.isUploading}
              >
                <TrashIcon
                  size={16}
                  strokeWidth={1.5}
                  className="text-base-content fill-error"
                />
              </button>
            </div>
            {/* Filename */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
              {image.filename}
            </div>
          </div>
        ))}

        {/* Upload Button */}
        {images.length < maxImages && (
          <label className="border-2 border-dashed border-base-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-base-200 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <svg
              className="w-8 h-8 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm opacity-70">Upload Images</span>
            <span className="text-xs opacity-50 mt-1">
              {images.length}/{maxImages}
            </span>
          </label>
        )}
      </div>
      {/* Status Message */}
      {uploadStatus && (
        <div className={`alert alert-${statusType} alert-sm`}>
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Image"
        size="sm"
      >
        <div className="py-4">
          <p className="mb-4">
            Are you sure you want to delete <strong>{imageToDelete}</strong>?
            This action cannot be undone.
          </p>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="error" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
