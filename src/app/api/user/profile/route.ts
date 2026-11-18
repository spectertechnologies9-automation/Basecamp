import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/user/profile
export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const profile = await queryOne<any>(
    'SELECT id, organization_id, email, full_name, display_name, bio, role, timezone, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ?',
    [user.id]
  );
  return NextResponse.json<ApiResponse>({ data: profile });
}

// PATCH /api/user/profile
export async function PATCH(req: Request) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const allowed = ['full_name', 'display_name', 'bio', 'timezone', 'avatar_url'];
    const updates: string[] = [];
    const values: any[] = [];

    for (const key of allowed) {
      if (key in body && body[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (updates.length > 0) {
      const now = new Date().toISOString();
      updates.push('updated_at = ?');
      values.push(now);
      values.push(user.id);

      await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const updated = await queryOne<any>(
      'SELECT id, organization_id, email, full_name, display_name, bio, role, timezone, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ?',
      [user.id]
    );

    return NextResponse.json<ApiResponse>({ data: updated, message: 'Profile updated' });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}
