import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query, execute } from '@/lib/db';
import { CampfireView } from '@/components/campfire/campfire-view';
import crypto from 'crypto';

export const metadata: Metadata = { title: 'Campfire' };

export default async function CampfirePage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT id, name, color FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  let channel = await queryOne<any>(
    "SELECT id FROM chat_channels WHERE project_id = ? AND type = 'campfire'",
    [params.id]
  );

  if (!channel) {
    const channelId = `chn_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    await execute(
      "INSERT INTO chat_channels (id, project_id, name, type, created_at) VALUES (?, ?, 'Campfire', 'campfire', ?)",
      [channelId, params.id, now]
    );
    channel = { id: channelId };
  }

  const rows = await query<any>(
    `SELECT m.*, u.full_name as author_name, u.avatar_url as author_avatar
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.author_id
     WHERE m.channel_id = ?
     ORDER BY m.created_at ASC
     LIMIT 100`,
    [channel.id]
  );

  const messages = rows.map((r) => ({
    id: r.id,
    channel_id: r.channel_id,
    author_id: r.author_id,
    body: r.body,
    type: r.type,
    created_at: r.created_at,
    author: {
      id: r.author_id,
      full_name: r.author_name || 'Team Member',
      avatar_url: r.author_avatar,
    },
  }));

  return (
    <CampfireView
      project={project}
      channelId={channel.id}
      messages={messages}
      currentUserId={user.id}
    />
  );
}
