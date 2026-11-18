import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { queryOne, execute } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { JoinProjectForm } from './join-form';

export const metadata: Metadata = {
  title: 'Join Project — SPECTER OS',
  description: 'Accept your invitation to collaborate on SPECTER OS',
};

interface Props {
  searchParams: {
    project_id?: string;
    role?: string;
    token?: string;
    email?: string;
  };
}

export default async function JoinPage({ searchParams }: Props) {
  const user = await getServerUser();
  const projectId = searchParams.project_id || '';
  const role = searchParams.role || 'member';
  const invitedEmail = searchParams.email ? decodeURIComponent(searchParams.email).trim().toLowerCase() : '';

  const project = projectId
    ? await queryOne<any>(
        'SELECT id, name, description, client_name FROM projects WHERE id = ?',
        [projectId]
      )
    : null;

  // If already logged in:
  if (user) {
    const userEmail = user.email.toLowerCase().trim();
    if (!invitedEmail || userEmail === invitedEmail) {
      const existing = await queryOne<any>(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, user.id]
      );

      if (!existing && projectId) {
        const now = new Date().toISOString();
        const projectRole = role === 'lead' ? 'lead' : role === 'client' ? 'client' : 'member';
        await execute(
          'INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
          [`pm_${Date.now()}`, projectId, user.id, projectRole, now]
        );
      }

      redirect(`/projects/${projectId}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 sm:p-6">
      <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-10 w-10 rounded-xl bg-orange-600 text-white items-center justify-center font-bold text-sm font-mono shadow-md mb-1">
            S
          </div>
          <h1 className="text-xl font-bold text-white font-display">
            Join Project Workspace
          </h1>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Accept project invitation
          </p>
        </div>

        {project ? (
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-orange-400">
              {project.client_name || 'PROJECT'}
            </span>
            <h2 className="text-sm font-bold text-white">{project.name}</h2>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                Role: <strong className="text-white">{role === 'lead' ? 'Team Lead' : role}</strong>
              </span>
              {invitedEmail && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {invitedEmail}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-400 font-mono">
            Invited as <span className="uppercase text-orange-400 font-semibold">{role}</span>
          </div>
        )}

        <JoinProjectForm projectId={projectId} role={role} invitedEmail={invitedEmail} />

        <div className="text-center text-xs text-zinc-500 font-mono pt-2 border-t border-zinc-800/80">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 underline font-semibold">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
