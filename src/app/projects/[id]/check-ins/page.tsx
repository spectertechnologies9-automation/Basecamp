import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query, execute } from '@/lib/db';
import { CheckInsView } from '@/components/checkins/checkins-view';
import crypto from 'crypto';

export const metadata: Metadata = { title: 'Automatic Check-ins' };

export default async function CheckInsPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT id, name, color FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  let checkIns = await query<any>(
    'SELECT * FROM check_ins WHERE project_id = ? ORDER BY created_at ASC',
    [params.id]
  );

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

  return (
    <CheckInsView
      project={project}
      initialCheckIns={checkInsWithResponses}
      currentUserId={user.id}
    />
  );
}
