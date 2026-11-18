import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getStorageQuota, getActiveStorageProvider, TWO_TB_BYTES } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Tally total bytes across all project files in the database
    const fileStats = await query<{ total_bytes: number; total_files: number }>(
      'SELECT SUM(file_size) as total_bytes, COUNT(id) as total_files FROM project_files'
    );

    const totalUsedBytes = Number(fileStats?.[0]?.total_bytes) || 0;
    const totalFilesCount = Number(fileStats?.[0]?.total_files) || 0;

    const quota = await getStorageQuota(totalUsedBytes);
    const activeProvider = getActiveStorageProvider();

    // Provider status
    const googleDriveConfigured = Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    );
    const r2Configured = Boolean(
      process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
    );

    return NextResponse.json({
      success: true,
      data: {
        ...quota,
        totalFiles: totalFilesCount,
        maxCapacity: '2.00 TB',
        maxCapacityBytes: TWO_TB_BYTES,
        activeProvider,
        integrations: {
          googleDrive: {
            configured: googleDriveConfigured,
            folderId: process.env.GOOGLE_DRIVE_FOLDER_ID ? 'Configured' : 'Default Root',
          },
          cloudflareR2: {
            configured: r2Configured,
            bucket: process.env.R2_BUCKET_NAME || 'nexaflow-storage',
          },
        },
      },
    });
  } catch (err: any) {
    console.error('[Storage API Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch storage quota' },
      { status: 500 }
    );
  }
}
