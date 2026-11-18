import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { MessageBoardView } from '@/components/messages/message-board-view';

export const metadata: Metadata = { title: 'Message Board' };

export default async function MessagesPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT id, name, color FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  const rows = await query<any>(
    `SELECT m.*, u.full_name as author_name, u.avatar_url as author_avatar
     FROM message_posts m
     LEFT JOIN users u ON u.id = m.author_id
     WHERE m.project_id = ?
     ORDER BY m.is_pinned DESC, m.created_at DESC`,
    [params.id]
  );

  const posts = rows.map((r) => ({
    id: r.id,
    project_id: r.project_id,
    title: r.title,
    body: r.body,
    author_id: r.author_id,
    is_pinned: Boolean(r.is_pinned),
    created_at: r.created_at,
    author: {
      id: r.author_id,
      full_name: r.author_name || 'Team Member',
      avatar_url: r.author_avatar,
    },
  }));

  return <MessageBoardView project={project} posts={posts} currentUserId={user.id} />;
}
