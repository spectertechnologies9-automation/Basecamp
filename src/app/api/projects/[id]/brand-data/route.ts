import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const moduleName = searchParams.get('module');

  if (moduleName) {
    const row = await queryOne<any>(
      'SELECT * FROM project_brand_data WHERE project_id = ? AND module = ?',
      [params.id, moduleName]
    );
    let parsed = null;
    if (row?.data) {
      try {
        parsed = JSON.parse(row.data);
      } catch {
        parsed = row.data;
      }
    }
    return NextResponse.json({ data: parsed });
  }

  const rows = await query<any>(
    'SELECT * FROM project_brand_data WHERE project_id = ?',
    [params.id]
  );
  return NextResponse.json({ data: rows });
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
    const body = await req.json();
    const { module, data } = body;

    if (!module) {
      return NextResponse.json({ error: 'Module name is required' }, { status: 400 });
    }

    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const existing = await queryOne<any>(
      'SELECT id FROM project_brand_data WHERE project_id = ? AND module = ?',
      [params.id, module]
    );

    const now = new Date().toISOString();

    if (existing) {
      await execute(
        'UPDATE project_brand_data SET data = ?, updated_at = ? WHERE id = ?',
        [dataString, now, existing.id]
      );
    } else {
      const id = `bd_${crypto.randomBytes(8).toString('hex')}`;
      await execute(
        `INSERT INTO project_brand_data (id, project_id, module, data, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, params.id, module, dataString, user.id, now, now]
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
