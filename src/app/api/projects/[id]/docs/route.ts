import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/projects/:id/docs
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<any>(
    `SELECT d.*, u.full_name as author_name
     FROM documents d
     LEFT JOIN users u ON u.id = d.author_id
     WHERE d.project_id = ?
     ORDER BY d.updated_at DESC`,
    [params.id]
  );

  return NextResponse.json<ApiResponse>({ data: rows });
}

// POST /api/projects/:id/docs
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const title = body.title?.trim();
    const content = body.body?.trim() || '';

    if (!title) {
      return NextResponse.json<ApiResponse>({ error: 'Title is required' }, { status: 400 });
    }

    const docId = `doc_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO documents (id, project_id, title, body, author_id, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)',
      [docId, params.id, title, content, user.id, now, now]
    );

    await execute(
      'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [`aud_${crypto.randomBytes(8).toString('hex')}`, user.organization_id || 'org_default', user.id, 'created a document', 'document', docId, now]
    );

    return NextResponse.json<ApiResponse>({
      data: {
        id: docId,
        project_id: params.id,
        title,
        body: content,
        author_id: user.id,
        author_name: user.full_name,
        created_at: now,
        updated_at: now,
      },
      message: 'Document created',
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to create document' }, { status: 500 });
  }
}
