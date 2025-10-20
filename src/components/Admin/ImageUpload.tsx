import React, { useState, useRef } from 'react';
import { Button } from '../react-ui/Button';

interface MultiImageUploadResponse {
  success: boolean;
  images?: string[];
  urls?: string[];
  slug?: string;
  message?: string;
  error?: string;
}

interface ImageUploadProps {
  onImagesUploaded: (images: string[], urls: string[]) => void;
  onImageRemoved: (index: number) => void;
  currentImages?: string[];
  productName: string;
  className?: string;
}

export function ImageUpload({
  onImagesUploaded,
  onImageRemoved,
  currentImages = [],
  productName,
  className = '',
}: ImageUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>(
    'info'
  );
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (currentImages.length > 0) {
      setUploadStatus(`${currentImages.length} additional image(s) loaded`);
      setStatusType('success');
    } else {
      setUploadStatus('');
    }
  }, [currentImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      setSelectedPreviews([]);
      return;
    }

    // Check total images limit (5 max additional images)
    if (files.length > 5) {
      setUploadStatus(
        `Cannot select ${files.length} images. Maximum 5 additional images allowed.`
      );
      setStatusType('error');
      setSelectedPreviews([]);
      return;
    }

    // Create preview URLs for selected files
    const previewPromises = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then((previews) => {
      setSelectedPreviews(previews);
    });

    setUploadStatus(`${files.length} image(s) selected - ready to upload`);
    setStatusType('info');
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      setUploadStatus('Please select image files');
      setStatusType('error');
      return;
    }

    if (!productName.trim()) {
      setUploadStatus('Please enter a product name first');
      setStatusType('error');
      return;
    }

    const files = Array.from(fileInputRef.current.files);

    try {
      setIsUploading(true);
      setUploadStatus(`Uploading ${files.length} image(s)...`);
      setStatusType('info');

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('productName', productName.trim());

      const response = await fetch('/api/products/upload-images', {
        method: 'POST',
        body: formData,
      });

      const result: MultiImageUploadResponse = await response.json();

      if (result.success && result.images && result.urls) {
        setUploadStatus(
          `${result.images.length} additional image(s) uploaded! (Replaced all previous additional images)`
        );
        setStatusType('success');
        onImagesUploaded(result.images, result.urls);

        // Clear file input and selected previews
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedPreviews([]);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadStatus(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setStatusType('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (index: number) => {
    const imageToRemove = currentImages[index];

    if (!imageToRemove || !productName) {
      onImageRemoved(index);
      return;
    }

    // Generate slug for API call
    const slug = productName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      setUploadStatus('Deleting image...');
      setStatusType('info');

      // Delete from R2
      const response = await fetch(
        `/api/products/delete-image?slug=${encodeURIComponent(slug)}&filename=${encodeURIComponent(imageToRemove)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete image');
      }

      setUploadStatus('Image deleted successfully');
      setStatusType('success');
      onImageRemoved(index);
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadStatus(
        `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setStatusType('error');
    }
  };

  const getStatusColor = () => {
    switch (statusType) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      default:
        return 'text-info';
    }
  };

  return (
    <div className={`form-control ${className}`}>
      <label className="label">
        <span className="label-text font-medium">
          Additional Images ({currentImages.length}/5)
        </span>
      </label>

      {/* Status Message */}
      {uploadStatus && (
        <div className={`text-sm mb-2 ${getStatusColor()}`}>{uploadStatus}</div>
      )}

      {/* Selected Files Preview (before upload) */}
      {selectedPreviews.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-warning mb-2">
            Selected files (ready to upload):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {selectedPreviews.map((previewUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={previewUrl}
                  className="w-full h-20 object-cover rounded border border-warning"
                  alt={`Selected image ${index + 1}`}
                />
                <span className="absolute top-1 left-1 bg-warning text-warning-content text-xs px-1 rounded">
                  {index + 1}
                </span>
                <div className="absolute top-1 right-1 bg-warning text-warning-content text-xs px-1 rounded">
                  NEW
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Images Preview Grid */}
      {currentImages.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {currentImages.map((imageName, index) => {
              const r2BucketUrl =
                'https://pub-67b76734f5b543b9925c0870089929bb.r2.dev';
              const slug = productName
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
              const imageUrl = `${r2BucketUrl}/products/${slug}/${imageName}`;

              return (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    className="w-full h-20 object-cover rounded border"
                    alt={`Additional image ${index + 1}`}
                  />
                  <span className="absolute top-1 left-1 bg-secondary text-secondary-content text-xs px-1 rounded">
                    {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="error"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemove(index)}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="file-input file-input-bordered flex-1"
          onChange={handleFileChange}
          disabled={false}
        />
        <Button
          type="button"
          loading={isUploading}
          className="w-full sm:w-auto"
          onClick={handleUpload}
          disabled={!fileInputRef.current?.files?.length || isUploading}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload
        </Button>
      </div>

      <div className="text-xs text-base-content/60 mt-2">
        • <strong>BULK UPLOAD:</strong> Select up to 5 images to replace ALL
        current additional images • Used for product gallery/slider (separate
        from main image) • Supported formats: JPEG, PNG, WebP • Maximum 5MB per
        image
      </div>
    </div>
  );
}
