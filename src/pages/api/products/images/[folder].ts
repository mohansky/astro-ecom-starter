// src/pages/api/products/images/[folder].ts
import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

export const GET: APIRoute = async ({ params }) => {
  try {
    const folder = params.folder;

    if (!folder) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Folder parameter required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Path to the images folder
    const imagesDir = path.join(process.cwd(), 'src', 'content', 'products', 'images', folder as string);

    if (!fs.existsSync(imagesDir)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Images folder not found',
        imagePath: null
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all image files in the folder
    const files = fs.readdirSync(imagesDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP'];

    const imageFiles = files.filter(file =>
      imageExtensions.some(ext => file.toLowerCase().endsWith(ext.toLowerCase()))
    );

    if (imageFiles.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No images found in folder',
        imagePath: null
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the first image (or you could sort and return a specific one)
    const firstImage = imageFiles.sort()[0]; // Sort to get consistent results
    const imagePath = `/products/${folder}/${firstImage}`;

    return new Response(JSON.stringify({
      success: true,
      imagePath,
      totalImages: imageFiles.length,
      allImages: imageFiles.map(file => `/products/${folder}/${file}`)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching product images:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};