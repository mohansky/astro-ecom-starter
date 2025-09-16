// src/lib/image-utils.ts
import type { ImageMetadata } from "astro";

/**
 * Get the first image for a product based on its slug/subdirectory
 * @param subDirectory - The subdirectory name (product slug)
 * @returns The image metadata or null if not found
 */
export async function getProductImage(subDirectory: string): Promise<ImageMetadata | null> {
  try {
    // Import ALL images from the products directory
    const allImages = import.meta.glob<{ default: ImageMetadata }>(
      "/src/content/products/images/**/*.{png,jpg,JPG,jpeg,gif,webp}",
      { eager: true }
    );

    // Filter images for the specific subdirectory
    const filteredImagePaths = Object.entries(allImages)
      .filter(([path]) => {
        const subDirPath = `/src/content/products/images/${subDirectory}/`;
        return path.startsWith(subDirPath);
      });

    if (filteredImagePaths.length > 0) {
      // Get the first image
      const [, imageModule] = filteredImagePaths[0];
      return imageModule.default;
    }

    return null;
  } catch (error) {
    console.error('Error loading product image:', error);
    return null;
  }
}

/**
 * Get all images for a product based on its slug/subdirectory
 * @param subDirectory - The subdirectory name (product slug)
 * @returns Array of image metadata
 */
export async function getProductImages(subDirectory: string): Promise<ImageMetadata[]> {
  try {
    // Import ALL images from the products directory
    const allImages = import.meta.glob<{ default: ImageMetadata }>(
      "/src/content/products/images/**/*.{png,jpg,JPG,jpeg,gif,webp}",
      { eager: true }
    );

    // Filter images for the specific subdirectory
    const filteredImagePaths = Object.entries(allImages)
      .filter(([path]) => {
        const subDirPath = `/src/content/products/images/${subDirectory}/`;
        return path.startsWith(subDirPath);
      });

    return filteredImagePaths.map(([, imageModule]) => imageModule.default);
  } catch (error) {
    console.error('Error loading product images:', error);
    return [];
  }
}

/**
 * Check if a product has images
 * @param subDirectory - The subdirectory name (product slug)
 * @returns boolean indicating if images exist
 */
export function hasProductImages(subDirectory: string): boolean {
  try {
    const allImages = import.meta.glob(
      "/src/content/products/images/**/*.{png,jpg,JPG,jpeg,gif,webp}"
    );

    const subDirPath = `/src/content/products/images/${subDirectory}/`;
    return Object.keys(allImages).some(path => path.startsWith(subDirPath));
  } catch (error) {
    console.error('Error checking product images:', error);
    return false;
  }
}

/**
 * Get a placeholder image path for products without images
 */
export function getPlaceholderImage(): string {
  return '/placeholder-product.jpg';
}