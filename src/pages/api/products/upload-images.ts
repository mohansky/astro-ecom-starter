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
    const files = formData.getAll('images') as File[];
    const productName = formData.get('productName') as string;

    if (!files.length || !productName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing image files or product name'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate maximum number of images (5 total)
    if (files.length > 5) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Maximum 5 images allowed per product'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return new Response(JSON.stringify({
          success: false,
          error: `Invalid file type for ${file.name}. Only JPEG, PNG, and WebP are allowed.`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (file.size > maxSize) {
        return new Response(JSON.stringify({
          success: false,
          error: `File ${file.name} is too large. Maximum size is 5MB.`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
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

    // Delete old additional images (image-1.*, image-2.*, etc.) before uploading new ones
    // Try common extensions for up to 5 images
    for (let i = 1; i <= 5; i++) {
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];
      for (const ext of extensions) {
        try {
          const oldKey = `products/${slug}/image-${i}.${ext}`;
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: oldKey,
          });
          await s3Client.send(deleteCommand);
          console.log(`Deleted old additional image: ${oldKey}`);
        } catch (err) {
          // Ignore errors - file might not exist
        }
      }
    }

    const uploadedImages: string[] = [];
    const uploadedUrls: string[] = [];

    // Upload each file with numbered naming for additional images
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

      // Generate filename for additional images: image-1.jpg, image-2.jpg, etc.
      const filename = `image-${i + 1}.${fileExtension}`;
      const r2Key = `products/${slug}/${filename}`;

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

      uploadedImages.push(filename);
      uploadedUrls.push(`${import.meta.env.R2_BUCKET_URL}/${r2Key}`);

      console.log(`Successfully uploaded to R2: ${r2Key}`);
    }

    // Return the array of image filenames and URLs
    return new Response(JSON.stringify({
      success: true,
      images: uploadedImages,
      urls: uploadedUrls,
      slug: slug,
      message: `${files.length} image(s) uploaded successfully to R2!`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error uploading images:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to process images: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};