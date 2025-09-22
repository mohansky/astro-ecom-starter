import type { APIRoute } from 'astro';
import { requireUserOrAdminAuth } from '@/lib/auth-utils';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const POST: APIRoute = async (context) => {
  try {
    // Check authentication - users can upload their own avatars, admins can upload any user's avatar
    const currentUser = await requireUserOrAdminAuth(context);
    if (currentUser instanceof Response) {
      return currentUser;
    }

    const formData = await context.request.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing avatar file'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If no userId provided, use current user's ID (for self-upload)
    const targetUserId = userId || currentUser.id;

    // Check if user is trying to upload for someone else (only admins allowed)
    if (userId && userId !== currentUser.id && currentUser.role !== 'admin') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized to upload avatar for other users'
      }), {
        status: 403,
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

    // Validate file size (2MB limit for avatars)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File too large. Maximum size is 2MB.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // Create R2 key with the structure: users/{userId}/avatar.{extension}
    const r2Key = `users/${targetUserId}/avatar.${fileExtension}`;

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

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    console.log(`Uploading avatar to R2: ${r2Key}`);

    // Upload to R2 using AWS SDK
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: new Uint8Array(fileBuffer),
      ContentType: file.type,
    });

    await s3Client.send(command);

    console.log(`Successfully uploaded avatar to R2: ${r2Key}`);

    // Return the avatar path that should be stored in the database
    const avatarPath = `${import.meta.env.R2_BUCKET_URL}/${r2Key}`;

    return new Response(JSON.stringify({
      success: true,
      avatarPath: avatarPath,
      message: 'Avatar uploaded successfully to R2!'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to process avatar: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};