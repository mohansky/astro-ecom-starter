import React, { useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

interface ProductImageSliderProps {
  mainImage?: string;
  images?: string[];
  productSlug: string;
  productName: string;
  className?: string;
}

export function ProductImageSlider({
  mainImage,
  images = [],
  productSlug,
  productName,
  className = '',
}: ProductImageSliderProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel();
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });

  // If there are additional images, show only those
  // If no additional images, show the main image
  const allImages = [];

  if (images && images.length > 0) {
    // Show only additional images if they exist
    images.forEach(img => {
      allImages.push({ type: 'additional', filename: img });
    });
  } else if (mainImage) {
    // Show main image only if no additional images
    allImages.push({ type: 'main', filename: mainImage });
  }

  const r2BucketUrl = 'https://pub-67b76734f5b543b9925c0870089929bb.r2.dev';

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    setSelectedIndex(emblaMainApi.selectedScrollSnap());
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi, emblaThumbsApi, setSelectedIndex]);

  React.useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();
    emblaMainApi.on('select', onSelect);
    emblaMainApi.on('reInit', onSelect);
  }, [emblaMainApi, onSelect]);

  if (allImages.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center w-full h-96 bg-base-200 rounded-lg">
          <div className="text-center">
            <div className="text-8xl mb-4">📦</div>
            <p className="text-base-content/70">No image available</p>
          </div>
        </div>
      </div>
    );
  }

  if (allImages.length === 1) {
    // Single image, no slider needed
    const imageUrl = `${r2BucketUrl}/products/${productSlug}/${allImages[0].filename}`;
    return (
      <div className={`${className}`}>
        <img
          src={imageUrl}
          alt={productName}
          className="w-full h-auto rounded-lg object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Main Image Carousel */}
      <div className="embla mb-4" ref={emblaMainRef}>
        <div className="embla__container flex">
          {allImages.map((image, index) => {
            const imageUrl = `${r2BucketUrl}/products/${productSlug}/${image.filename}`;
            return (
              <div key={index} className="embla__slide flex-[0_0_100%] min-w-0">
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={`${productName} - Image ${index + 1}`}
                    className="w-full h-auto rounded-lg object-cover"
                  />
                  {image.type === 'main' && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-content text-xs px-2 py-1 rounded-full">
                      Main
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="embla-thumbs" ref={emblaThumbsRef}>
        <div className="embla__container flex gap-2">
          {allImages.map((image, index) => {
            const imageUrl = `${r2BucketUrl}/products/${productSlug}/${image.filename}`;
            return (
              <div
                key={index}
                className="embla__slide flex-[0_0_auto]"
              >
                <button
                  onClick={() => onThumbClick(index)}
                  className={`relative block w-16 h-16 rounded border-2 transition-all ${
                    index === selectedIndex
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-base-300 hover:border-primary/50'
                  }`}
                  type="button"
                >
                  <img
                    src={imageUrl}
                    alt={`${productName} thumbnail ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  {image.type === 'main' && (
                    <div className="absolute -top-1 -left-1 bg-primary text-primary-content text-xs px-1 rounded-full">
                      M
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}