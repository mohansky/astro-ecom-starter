import type { APIRoute } from 'astro';
import { requireUserOrAdminAuth } from '@/lib/auth-utils';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const POST: APIRoute = async (context) => {
  try {
    // Check authentication
    const authResult = await requireUserOrAdminAuth(context);
    if (authResult instanceof Response) {
      return authResult;
    }

    const formData = await context.request.formData();
    const file = formData.get('image') as File;
    const productName = formData.get('productName') as string;
    const originalFilename = formData.get('originalFilename') as string;

    if (!file || !productName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing image file or product name'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate slug from product name
    const slug = productName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    if (!slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid product name for slug generation'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use original filename (keep it as is)
    const fileName = originalFilename || file.name;
    const r2Key = `products/${slug}/${fileName}`;

    // Get R2 credentials from environment
    const accountId = import.meta.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = import.meta.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.R2_SECRET_ACCESS_KEY;
    const bucketName = import.meta.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'R2 configuration missing'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // If file with same name exists, it will be replaced automatically
    // No need to explicitly delete - S3/R2 PutObject overwrites

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    console.log(`Uploading to R2: ${r2Key}`);

    // Upload to R2 using AWS SDK
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    console.log(`Successfully uploaded to R2: ${r2Key}`);

    // Return the filename that should be stored in the database
    return new Response(JSON.stringify({
      success: true,
      imagePath: fileName,
      url: `${import.meta.env.R2_BUCKET_URL}/${r2Key}`,
      message: 'Image uploaded successfully to R2!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error uploading image:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to process image: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};