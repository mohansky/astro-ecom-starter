import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

/**
 * Move all files from one product folder to another in R2
 * Used when product slug changes
 */
export async function moveProductImagesInR2(
  oldSlug: string,
  newSlug: string,
  r2Config: R2Config
): Promise<{ success: boolean; movedCount: number; error?: string }> {
  try {
    const { accountId, accessKeyId, secretAccessKey, bucketName } = r2Config;

    // Create S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const oldPrefix = `products/${oldSlug}/`;
    const newPrefix = `products/${newSlug}/`;
    let movedCount = 0;
    let continuationToken: string | undefined = undefined;
    let foundAny = false;

    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: oldPrefix,
        ContinuationToken: continuationToken,
      });

      const listResult: ListObjectsV2CommandOutput = await s3Client.send(
        listCommand as any
      );
      const objects = listResult.Contents || [];

      if (objects.length > 0) {
        foundAny = true;
        console.log(`Found ${objects.length} files in page to move`);
      }

      // Copy each file to new location for this page
      for (const obj of objects) {
        if (!obj.Key) continue;

        // Get filename from old key
        const filename = obj.Key.replace(oldPrefix, '');
        const newKey = `${newPrefix}${filename}`;

        console.log(`Copying ${obj.Key} -> ${newKey}`);

        // Copy object
        const copyCommand = new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${obj.Key}`,
          Key: newKey,
        });

        await s3Client.send(copyCommand);

        // Delete old object
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: obj.Key,
        });

        await s3Client.send(deleteCommand);

        movedCount++;
        console.log(`Moved: ${obj.Key} -> ${newKey}`);
      }

      continuationToken = listResult.IsTruncated
        ? listResult.NextContinuationToken
        : undefined;
    } while (continuationToken);

    if (!foundAny) {
      console.log('No images found to move');
      return { success: true, movedCount: 0 };
    }

    console.log(`Successfully moved ${movedCount} files`);

    return {
      success: true,
      movedCount,
    };
  } catch (error: any) {
    console.error('Error moving product images in R2:', error);
    return {
      success: false,
      movedCount: 0,
      error: error.message || 'Failed to move images',
    };
  }
}

/**
 * Delete all images for a product in R2
 */
export async function deleteProductImagesInR2(
  slug: string,
  r2Config: R2Config
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const { accountId, accessKeyId, secretAccessKey, bucketName } = r2Config;

    // Create S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const prefix = `products/${slug}/`;

    console.log(`Deleting all images in ${prefix}`);

    // List all objects in folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const listResult = await s3Client.send(listCommand);
    const objects = listResult.Contents || [];

    if (objects.length === 0) {
      console.log('No images found to delete');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${objects.length} files to delete`);

    let deletedCount = 0;

    // Delete each file
    for (const obj of objects) {
      if (!obj.Key) continue;

      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: obj.Key,
      });

      await s3Client.send(deleteCommand);
      deletedCount++;
      console.log(`Deleted: ${obj.Key}`);
    }

    console.log(`Successfully deleted ${deletedCount} files`);

    return {
      success: true,
      deletedCount,
    };
  } catch (error: any) {
    console.error('Error deleting product images in R2:', error);
    return {
      success: false,
      deletedCount: 0,
      error: error.message || 'Failed to delete images',
    };
  }
}
