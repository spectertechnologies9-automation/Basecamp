import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/constants';
import { formatTimeAgo, getAvatarColor, getInitials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Project Members' };

export default async function ProjectMembersPage({ params }: { params: { id: string } }) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const project = await queryOne<any>('SELECT id, name, color FROM projects WHERE id = ?', [params.id]);
  if (!project) notFound();

  const members = await query<any>(
    `SELECT pm.*, u.full_name, u.email, u.avatar_url, u.last_seen_at
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = ?
       AND u.role != 'super_admin'
       AND u.role != 'owner'
       AND u.email != 'superadmin@specteros.agency'
     ORDER BY pm.created_at ASC`,
    [params.id]
  );

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${params.id}`} className="hover:opacity-70" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            <ArrowLeft size={16} />
          </Link>
          <Users size={18} style={{ color: 'var(--nf-accent, #39C6AE)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            Members · {project.name}
          </h1>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        {members.map((m: any) => {
          const color = getAvatarColor(m.user_id);
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 px-5 py-4 border-b last:border-0 hover:bg-white/5 transition-colors"
              style={{ borderColor: 'var(--nf-border, #35464E)', background: 'var(--nf-panel, #131E24)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: color + '33', color }}
              >
                {getInitials(m.full_name ?? 'U')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  {m.full_name}
                </p>
                <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  {m.email}
                </p>
              </div>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full capitalize font-medium"
                style={{ background: 'var(--nf-card, #1C2A31)', color: 'var(--nf-accent, #39C6AE)' }}
              >
                {ROLE_LABELS[m.role] ?? m.role}
              </span>
              {m.last_seen_at && (
                <span className="text-[11px] hidden sm:block" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  Active {formatTimeAgo(m.last_seen_at)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
