import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { uploadFile } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let sql = 'SELECT * FROM project_files WHERE project_id = ?';
  const queryParams: any[] = [params.id];

  if (category) {
    sql += ' AND category = ?';
    queryParams.push(category);
  }

  sql += ' ORDER BY created_at DESC';

  const files = await query<any>(sql, queryParams);
  return NextResponse.json({ data: files });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save using Modular Unified Storage (Google Drive 2TB / Cloudflare R2 / Local fallback)
    const uploadResult = await uploadFile({
      buffer,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      projectId: params.id,
      category,
    });

    const fileId = `file_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO project_files (
        id, project_id, name, file_path, file_size, mime_type, category, uploaded_by, storage_provider, storage_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileId,
        params.id,
        file.name,
        uploadResult.fileUrl,
        uploadResult.size,
        file.type || 'application/octet-stream',
        category,
        user.id,
        uploadResult.provider,
        uploadResult.storageKey,
        now,
      ]
    );

    // Audit log
    await execute(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, 'file.upload', 'project', ?, ?)`,
      [`audit_${crypto.randomBytes(8).toString('hex')}`, user.organization_id || 'org_default', user.id, params.id, now]
    );

    return NextResponse.json({
      data: {
        id: fileId,
        project_id: params.id,
        name: file.name,
        file_path: uploadResult.fileUrl,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        category,
        uploaded_by: user.id,
        storage_provider: uploadResult.provider,
        storage_key: uploadResult.storageKey,
        created_at: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id') || searchParams.get('file_id');

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
  }

  try {
    const file = await query<any>('SELECT * FROM project_files WHERE id = ? AND project_id = ?', [fileId, params.id]);
    if (!file || file.length === 0) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileRecord = file[0];

    // Permission check: Admins, Team Leads, or original uploader only
    const isGlobalAdmin = user.role === 'admin' || user.role === 'owner';
    const member = await query<any>('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [params.id, user.id]);
    const isLead = member && member.length > 0 && (member[0].role === 'lead' || member[0].role === 'owner' || member[0].role === 'team_lead' || member[0].role === 'brand_manager');
    const isUploader = fileRecord.uploaded_by === user.id;

    if (!isGlobalAdmin && !isLead && !isUploader) {
      return NextResponse.json({ error: 'Permission denied. Only Admins and Team Leads can delete project files.' }, { status: 403 });
    }

    if (fileRecord.file_path && fileRecord.file_path.startsWith('/uploads/')) {
      const diskPath = path.join(process.cwd(), 'public', fileRecord.file_path.replace(/^\//, ''));
      try {
        await fs.unlink(diskPath);
      } catch {}
    }

    await execute('DELETE FROM project_files WHERE id = ? AND project_id = ?', [fileId, params.id]);

    const now = new Date().toISOString();
    await execute(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, 'file.delete', 'project', ?, ?)`,
      [`audit_${crypto.randomBytes(8).toString('hex')}`, user.organization_id || 'org_default', user.id, params.id, now]
    );

    return NextResponse.json({ message: 'File deleted successfully', file_id: fileId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete file' }, { status: 500 });
  }
}
