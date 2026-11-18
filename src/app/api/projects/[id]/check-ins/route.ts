import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/projects/:id/check-ins
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  let checkIns = await query<any>(
    'SELECT * FROM check_ins WHERE project_id = ? ORDER BY created_at ASC',
    [params.id]
  );

  // If none exist, seed default daily standup check-in question
  if (checkIns.length === 0) {
    const cid = `chk_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    await execute(
      'INSERT INTO check_ins (id, project_id, question, schedule, participant_ids, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [cid, params.id, 'What did you work on today, and what are you planning for tomorrow?', 'Daily at 5:00 PM', JSON.stringify([user.id]), now]
    );
    checkIns = await query<any>('SELECT * FROM check_ins WHERE project_id = ? ORDER BY created_at ASC', [params.id]);
  }

  const checkInsWithResponses = await Promise.all(
    checkIns.map(async (ci) => {
      const responses = await query<any>(
        `SELECT r.*, u.full_name as author_name, u.avatar_url as author_avatar
         FROM check_in_responses r
         JOIN users u ON u.id = r.user_id
         WHERE r.check_in_id = ?
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [ci.id]
      );
      return { ...ci, responses };
    })
  );

  return NextResponse.json<ApiResponse>({ data: checkInsWithResponses });
}

// POST /api/projects/:id/check-ins — reply to a check-in or create a new question
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const now = new Date().toISOString();

    if (body.check_in_id && body.response) {
      // Replying to a check-in
      const respId = `res_${crypto.randomBytes(8).toString('hex')}`;
      await execute(
        'INSERT INTO check_in_responses (id, check_in_id, user_id, response, created_at) VALUES (?, ?, ?, ?, ?)',
        [respId, body.check_in_id, user.id, body.response.trim(), now]
      );

      const resp = {
        id: respId,
        check_in_id: body.check_in_id,
        user_id: user.id,
        author_name: user.full_name,
        response: body.response.trim(),
        created_at: now,
      };
      return NextResponse.json<ApiResponse>({ data: resp, message: 'Response posted' });
    }

    if (body.question) {
      // Creating a new check-in question
      const cid = `chk_${crypto.randomBytes(8).toString('hex')}`;
      await execute(
        'INSERT INTO check_ins (id, project_id, question, schedule, participant_ids, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [cid, params.id, body.question.trim(), body.schedule || 'Daily', JSON.stringify([user.id]), now]
      );
      return NextResponse.json<ApiResponse>({ data: { id: cid, question: body.question.trim(), responses: [] } });
    }

    return NextResponse.json<ApiResponse>({ error: 'Invalid request' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Failed to save check-in' }, { status: 500 });
  }
}
