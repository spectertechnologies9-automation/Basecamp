import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  projectId?: string;
  category?: string;
}

export interface UploadResult {
  fileUrl: string;
  storageKey: string;
  size: number;
  provider: string;
  previewUrl?: string;
}

export interface StorageQuota {
  totalBytes: number;
  usedBytes: number;
  usagePercentage: number;
  provider: string;
  formattedTotal: string;
  formattedUsed: string;
}

// 2TB in bytes (2 * 1024 * 1024 * 1024 * 1024)
export const TWO_TB_BYTES = 2 * 1024 * 1024 * 1024 * 1024;

export function getActiveStorageProvider(): 'google-drive' | 'r2' | 's3' | 'local' {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase()?.trim();
  if (provider === 'google-drive' || provider === 'gdrive') return 'google-drive';
  if (provider === 'r2' || provider === 'cloudflare-r2') return 'r2';
  if (provider === 's3') return 's3';
  return 'local';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Dynamic module loaders that avoid webpack bundling errors when optional SDKs are not present
async function getGoogleDriveModule(): Promise<any> {
  try {
    const dynamicImport = new Function('modulePath', 'return import(modulePath)');
    return await dynamicImport('googleapis');
  } catch {
    return null;
  }
}

async function getAwsS3Module(): Promise<any> {
  try {
    const dynamicImport = new Function('modulePath', 'return import(modulePath)');
    return await dynamicImport('@aws-sdk/client-s3');
  } catch {
    return null;
  }
}

/**
 * ── Google Drive Provider (for 2TB Google Drive) ──
 */
async function uploadToGoogleDrive(options: UploadOptions): Promise<UploadResult> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    console.warn('[Storage] Google Drive credentials not fully configured in env, falling back to local storage.');
    return uploadToLocalStorage(options);
  }

  try {
    const gModule = await getGoogleDriveModule();
    if (!gModule || !gModule.google) {
      console.warn('[Storage] googleapis SDK is not installed, falling back to local storage.');
      return uploadToLocalStorage(options);
    }
    const { google } = gModule;

    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Stream upload
    const { Readable } = await import('stream');
    const stream = new Readable();
    stream.push(options.buffer);
    stream.push(null);

    const fileMetadata: any = {
      name: options.filename,
    };
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: options.mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink, webContentLink',
    });

    const fileId = response.data.id || `gdrive_${crypto.randomBytes(8).toString('hex')}`;
    const webViewLink = response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
    const downloadUrl = response.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`;

    return {
      fileUrl: downloadUrl,
      previewUrl: webViewLink,
      storageKey: fileId,
      size: options.buffer.length,
      provider: 'google-drive',
    };
  } catch (err) {
    console.error('[Storage: Google Drive Error]:', err);
    return uploadToLocalStorage(options);
  }
}

/**
 * ── Cloudflare R2 / AWS S3 Provider (Native Edge Object Storage) ──
 */
async function uploadToCloudflareR2(options: UploadOptions): Promise<UploadResult> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'nexaflow-storage';
  const publicBaseUrl = process.env.R2_PUBLIC_URL || '';

  if (!accessKeyId || !secretAccessKey) {
    console.warn('[Storage] Cloudflare R2 credentials not set in env, falling back to local.');
    return uploadToLocalStorage(options);
  }

  try {
    const s3Module = await getAwsS3Module();
    if (!s3Module || !s3Module.S3Client) {
      console.warn('[Storage] @aws-sdk/client-s3 is not installed, falling back to local.');
      return uploadToLocalStorage(options);
    }
    const { S3Client, PutObjectCommand } = s3Module;

    const s3Endpoint = accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : process.env.S3_ENDPOINT;

    const s3 = new S3Client({
      region: 'auto',
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const safeExt = path.extname(options.filename);
    const key = `projects/${options.projectId || 'general'}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}${safeExt}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: options.buffer,
        ContentType: options.mimeType,
      })
    );

    const publicUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, '')}/${key}` : `/${key}`;

    return {
      fileUrl: publicUrl,
      previewUrl: publicUrl,
      storageKey: key,
      size: options.buffer.length,
      provider: 'r2',
    };
  } catch (err) {
    console.error('[Storage: Cloudflare R2 Error]:', err);
    return uploadToLocalStorage(options);
  }
}

/**
 * ── Local Filesystem Provider (Local Development fallback) ──
 */
async function uploadToLocalStorage(options: UploadOptions): Promise<UploadResult> {
  const targetDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'projects',
    options.projectId || 'general'
  );

  try {
    await fs.mkdir(targetDir, { recursive: true });
    const ext = path.extname(options.filename);
    const baseName = path.basename(options.filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = `${baseName}_${Date.now()}${ext}`;
    const filePathOnDisk = path.join(targetDir, safeFileName);

    await fs.writeFile(filePathOnDisk, options.buffer);
    const publicUrl = `/uploads/projects/${options.projectId || 'general'}/${safeFileName}`;

    return {
      fileUrl: publicUrl,
      previewUrl: publicUrl,
      storageKey: safeFileName,
      size: options.buffer.length,
      provider: 'local',
    };
  } catch (err) {
    console.error('[Storage: Local Filesystem Error]:', err);
    throw err;
  }
}

/**
 * ── Main Unified Storage Upload Entrypoint ──
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const provider = getActiveStorageProvider();

  if (provider === 'google-drive') {
    return uploadToGoogleDrive(options);
  }
  if (provider === 'r2' || provider === 's3') {
    return uploadToCloudflareR2(options);
  }
  return uploadToLocalStorage(options);
}

/**
 * ── Get Live 2TB Storage Quota Usage ──
 */
export async function getStorageQuota(currentDbTotalBytes: number = 0): Promise<StorageQuota> {
  const provider = getActiveStorageProvider();

  if (provider === 'google-drive') {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (serviceAccountEmail && privateKey) {
      try {
        const gModule = await getGoogleDriveModule();
        if (gModule && gModule.google) {
          const { google } = gModule;
          const auth = new google.auth.JWT({
            email: serviceAccountEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
          });
          const drive = google.drive({ version: 'v3', auth });
          const about = await drive.about.get({ fields: 'storageQuota' });
          const quota = about.data.storageQuota;

          if (quota) {
            const total = Number(quota.limit) || TWO_TB_BYTES;
            const used = Number(quota.usage) || currentDbTotalBytes;
            return {
              totalBytes: total,
              usedBytes: used,
              usagePercentage: Math.min(100, parseFloat(((used / total) * 100).toFixed(1))),
              provider: 'google-drive',
              formattedTotal: formatBytes(total),
              formattedUsed: formatBytes(used),
            };
          }
        }
      } catch (err) {
        console.warn('[Storage Quota: GDrive API notice]:', err);
      }
    }
  }

  // Default calculation against 2TB limit
  const total = TWO_TB_BYTES;
  const used = currentDbTotalBytes;
  return {
    totalBytes: total,
    usedBytes: used,
    usagePercentage: Math.min(100, parseFloat(((used / total) * 100).toFixed(1))),
    provider,
    formattedTotal: '2.00 TB',
    formattedUsed: formatBytes(used),
  };
}
