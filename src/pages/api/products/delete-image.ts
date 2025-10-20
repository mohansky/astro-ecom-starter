import type { APIRoute } from 'astro';
import { requireUserOrAdminAuth } from '@/lib/auth-utils';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const DELETE: APIRoute = async (context) => {
  try {
    // Check authentication
    const authResult = await requireUserOrAdminAuth(context);
    if (authResult instanceof Response) {
      return authResult;
    }

    const url = new URL(context.request.url);
    const slug = url.searchParams.get('slug');
    const filename = url.searchParams.get('filename');

    if (!slug || !filename) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing slug or filename parameter'
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

    const r2Key = `products/${slug}/${filename}`;

    console.log(`Deleting from R2: ${r2Key}`);

    // Delete from R2 using AWS SDK
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
    });

    await s3Client.send(command);

    console.log(`Successfully deleted from R2: ${r2Key}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Image deleted successfully from R2'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error deleting image:', error);
    return new Response(JSON.stringify({
      success: false,
      error: `Failed to delete image: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
