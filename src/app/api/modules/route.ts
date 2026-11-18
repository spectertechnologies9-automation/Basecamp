import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

const DEFAULT_MODULES = {
  campfire: true,
  message_board: true,
  card_table: true,
  hill_chart: true,
  check_ins: true,
  docs: true,
  time_tracking: true,
  whatsapp: true,
  ai_assistant: true,
};

// GET /api/modules
export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  await execute(`
    CREATE TABLE IF NOT EXISTS platform_modules (
      organization_id TEXT PRIMARY KEY,
      modules TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const row = await queryOne<any>(
    'SELECT modules FROM platform_modules WHERE organization_id = ?',
    [user.organization_id || 'org_default']
  );

  const modules = row?.modules ? JSON.parse(row.modules) : DEFAULT_MODULES;
  return NextResponse.json<ApiResponse>({ data: modules });
}

// POST /api/modules — toggle a module
export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const targetKey = body.key || body.module_key;
    const targetEnabled = body.enabled !== undefined ? body.enabled : body.is_enabled;

    if (!targetKey) {
      return NextResponse.json<ApiResponse>({ error: 'Module key is required' }, { status: 400 });
    }

    const orgId = user.organization_id || 'org_default';
    const row = await queryOne<any>(
      'SELECT modules FROM platform_modules WHERE organization_id = ?',
      [orgId]
    );

    const current = row?.modules ? JSON.parse(row.modules) : { ...DEFAULT_MODULES };
    current[targetKey] = Boolean(targetEnabled);

    const now = new Date().toISOString();
    await execute(
      'INSERT OR REPLACE INTO platform_modules (organization_id, modules, updated_at) VALUES (?, ?, ?)',
      [orgId, JSON.stringify(current), now]
    );

    return NextResponse.json<ApiResponse>({ data: current, message: `Module ${targetKey} updated` });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to update module' }, { status: 500 });
  }
}
