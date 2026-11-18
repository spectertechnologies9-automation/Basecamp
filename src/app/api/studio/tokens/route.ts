import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
import { canViewAdminStudio } from '@/lib/permissions';
import type { ApiResponse, UserRole } from '@/types';

// GET /api/studio/tokens
export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const orgId = user.organization_id || 'org_default';
  const row = await queryOne<any>(
    'SELECT tokens FROM design_tokens WHERE organization_id = ? AND is_published = 1',
    [orgId]
  );

  return NextResponse.json<ApiResponse>({
    data: row?.tokens ? JSON.parse(row.tokens) : {},
  });
}

// POST /api/studio/tokens
export async function POST(request: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.tokens || typeof body.tokens !== 'object') {
    return NextResponse.json<ApiResponse>({ error: 'tokens object required' }, { status: 400 });
  }

  const orgId = user.organization_id || 'org_default';
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO design_tokens (organization_id, tokens, is_published, updated_at)
     VALUES (?, ?, 1, ?)
     ON CONFLICT(organization_id) DO UPDATE SET tokens = excluded.tokens, updated_at = excluded.updated_at`,
    [orgId, JSON.stringify(body.tokens), now]
  );

  return NextResponse.json<ApiResponse>({ message: 'Tokens published' });
}
