import React, { useState, useRef } from 'react';
import { Button } from '../react-ui/Button';

interface MainImageUploadResponse {
  success: boolean;
  imagePath?: string;
  url?: string;
  error?: string;
}

interface MainImageUploadProps {
  onImageUploaded: (imagePath: string, imageUrl: string) => void;
  onImageRemoved: () => void;
  currentImage?: string;
  productName: string;
  className?: string;
}

export function MainImageUpload({
  onImageUploaded,
  onImageRemoved,
  currentImage,
  productName,
  className = '',
}: MainImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>(
    'info'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (currentImage && productName) {
      const r2BucketUrl = 'https://pub-67b76734f5b543b9925c0870089929bb.r2.dev';
      const slug = productName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const imageUrl = `${r2BucketUrl}/products/${slug}/${currentImage}`;
      setPreviewUrl(imageUrl);
      setUploadStatus('Main image loaded');
      setStatusType('success');
    } else if (!currentImage) {
      setPreviewUrl('');
      setUploadStatus('');
    }
  }, [currentImage, productName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviewUrl(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setUploadStatus('Please select an image file');
      setStatusType('error');
      return;
    }

    if (!productName.trim()) {
      setUploadStatus('Please enter a product name first');
      setStatusType('error');
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('Uploading main image...');
      setStatusType('info');

      const formData = new FormData();
      formData.append('image', fileInputRef.current.files[0]);
      formData.append('productName', productName.trim());
      formData.append('isMainImage', 'true');

      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result: MainImageUploadResponse = await response.json();

      if (result.success && result.imagePath && result.url) {
        setUploadStatus('Main image uploaded!');
        setStatusType('success');
        setPreviewUrl(result.url);
        onImageUploaded(result.imagePath, result.url);

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading main image:', error);
      setUploadStatus(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setStatusType('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentImage || !productName) {
      // If no image is saved, just clear the preview
      setPreviewUrl('');
      setUploadStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onImageRemoved();
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
        `/api/products/delete-image?slug=${encodeURIComponent(slug)}&filename=${encodeURIComponent(currentImage)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete image');
      }

      setPreviewUrl('');
      setUploadStatus('Image deleted successfully');
      setStatusType('success');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onImageRemoved();
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
          Main Product Image (Feature Image)
        </span>
      </label>

      {/* Status Message */}
      {uploadStatus && (
        <div className={`text-sm mb-2 ${getStatusColor()}`}>{uploadStatus}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Image Preview */}
        {previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              className="w-32 h-32 object-cover rounded-lg border-2 border-primary"
              alt="Main image preview"
            />
            <div className="absolute -top-2 -left-2 bg-primary text-primary-content text-xs px-2 py-1 rounded-full">
              Main
            </div>
            <Button
              type="button"
              variant="error"
              size="sm"
              className="absolute -top-2 -right-2"
              onClick={handleRemove}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        )}

        {/* Upload Controls */}
        <div className="flex flex-col gap-2 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="file-input file-input-bordered"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            loading={isUploading}
            onClick={handleUpload}
            disabled={!fileInputRef.current?.files?.[0] || isUploading}
            className="w-full"
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
            Upload Main Image
          </Button>
        </div>
      </div>

      <div className="text-xs text-base-content/60 mt-2">
        • This will be the primary image shown in product listings • Supported
        formats: JPEG, PNG, WebP • Maximum 5MB per image
      </div>
    </div>
  );
}
