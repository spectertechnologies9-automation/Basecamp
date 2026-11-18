import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const entries = await query<any>(
    `SELECT t.*, u.full_name as user_name, p.name as project_name
     FROM time_entries t
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN projects p ON p.id = t.project_id
     ORDER BY t.date DESC`
  );

  return NextResponse.json<ApiResponse>({ data: entries });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { project_id, duration_minutes, notes, date } = body;

    const id = `tim_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    const orgId = user.organization_id || 'org_default';

    await execute(
      'INSERT INTO time_entries (id, organization_id, project_id, user_id, duration_minutes, notes, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, orgId, project_id || null, user.id, parseInt(duration_minutes, 10) || 60, notes?.trim() || null, date || now.slice(0, 10), now]
    );

    return NextResponse.json<ApiResponse>({ message: 'Time logged successfully', data: { id } });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to log time' }, { status: 500 });
  }
}
