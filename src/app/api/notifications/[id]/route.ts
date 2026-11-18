import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// PATCH /api/notifications/:id — mark single notification as read
export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date().toISOString();
  await execute('UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ?', [now, params.id, user.id]);

  return NextResponse.json<ApiResponse>({ message: 'Marked as read' });
}

// DELETE /api/notifications/:id — dismiss notification
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  await execute('DELETE FROM notifications WHERE id = ? AND user_id = ?', [params.id, user.id]);

  return NextResponse.json<ApiResponse>({ message: 'Notification dismissed' });
}
