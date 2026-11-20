'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Palette, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PROJECT_COLORS } from '@/lib/constants';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Max 100 characters'),
  description: z.string().max(500, 'Max 500 characters').optional(),
  color: z.string().default('#39C6AE'),
  status: z.enum(['active', 'on_hold']).default('active'),
  visibility: z.enum(['private', 'organization', 'public']).default('organization'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

interface MemberSelection {
  userId: string;
  projectRole: 'lead' | 'member' | 'client';
  workspaceRole?: string;
}

export function CreateProjectForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState('#39C6AE');
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, MemberSelection>>({});

  useEffect(() => {
    let membersList: any[] = [];
    fetch('/api/team/members')
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          membersList = res.data;
        }
        try {
          const stored = localStorage.getItem('specter_registered_users');
          if (stored) {
            const regList = JSON.parse(stored);
            for (const reg of regList) {
              if (
                reg.role !== 'super_admin' &&
                reg.email !== 'superadmin@specteros.agency' &&
                !membersList.some((m) => m.id === reg.id || m.email?.toLowerCase() === reg.email?.toLowerCase())
              ) {
                membersList.push({
                  id: reg.id,
                  full_name: reg.full_name || reg.email.split('@')[0],
                  email: reg.email,
                  role: reg.role || 'role_not_assigned',
                });
              }
            }
          }
        } catch {}
        // Filter out stealth super admin
        setTeamMembers(
          membersList.filter((m) => m.role !== 'super_admin' && m.email !== 'superadmin@specteros.agency')
        );
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem('specter_registered_users');
          if (stored) {
            const regList = JSON.parse(stored);
            setTeamMembers(regList.filter((r: any) => r.role !== 'super_admin'));
          }
        } catch {}
      });
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { color: '#39C6AE', status: 'active', visibility: 'organization' },
  });

  const toggleMember = (member: any) => {
    setSelectedMembers((prev) => {
      const copy = { ...prev };
      if (copy[member.id]) {
        delete copy[member.id];
      } else {
        const needsRole = member.role === 'role_not_assigned' || !member.role;
        copy[member.id] = {
          userId: member.id,
          projectRole: 'member',
          workspaceRole: needsRole ? 'member' : member.role,
        };
      }
      return copy;
    });
  };

  const updateProjectRole = (id: string, role: 'lead' | 'member' | 'client') => {
    setSelectedMembers((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], projectRole: role },
      };
    });
  };

  const updateWorkspaceRole = (id: string, wsRole: string) => {
    setSelectedMembers((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], workspaceRole: wsRole },
      };
    });
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: wsRole } : m))
    );
  };

  const onSubmit = async (data: CreateProjectFormValues) => {
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, color: selectedColor }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create project.');
        return;
      }

      const projectId = result.data?.id;
      if (projectId) {
        // Assign selected team members & update their roles
        const entries = Object.values(selectedMembers);
        for (const entry of entries) {
          try {
            await fetch(`/api/projects/${projectId}/members`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: entry.userId,
                role: entry.projectRole,
                workspace_role: entry.workspaceRole,
              }),
            });
          } catch {}

          if (entry.workspaceRole) {
            try {
              const stored = localStorage.getItem('specter_registered_users');
              if (stored) {
                const regList = JSON.parse(stored);
                const updatedList = regList.map((u: any) =>
                  u.id === entry.userId ? { ...u, role: entry.workspaceRole } : u
                );
                localStorage.setItem('specter_registered_users', JSON.stringify(updatedList));
              }
            } catch {}
          }
        }

        router.push(`/projects/${projectId}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Network error creating project.');
    }
  };

  const selectColor = (c: string) => {
    setSelectedColor(c);
    setValue('color', c);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      <div
        className="rounded-2xl border p-8"
        style={{
          background: 'var(--nf-panel, #131E24)',
          borderColor: 'var(--nf-border, #35464E)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm"
            style={{ background: selectedColor + '22', color: selectedColor }}
          >
            <Palette size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Make a new project
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Set up a shared space for tasks, campfire chat, and team collaboration
            </p>
          </div>
        </div>

        {error && (
          <div
            className="p-3 rounded-lg text-xs mb-4"
            style={{ background: 'rgba(229,107,112,0.15)', color: 'var(--nf-danger, #E56B70)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Project name *
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Mobile App Redesign, Marketing Q3, Platform Migration"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: 'var(--nf-card, #1C2A31)',
                border: `1px solid ${errors.name ? 'var(--nf-danger, #E56B70)' : 'var(--nf-border, #35464E)'}`,
                color: 'var(--nf-text, #F2F6F8)',
              }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: 'var(--nf-danger, #E56B70)' }}>{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="What is this project about? What are the key goals?"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none resize-none transition-colors"
              style={{
                background: 'var(--nf-card, #1C2A31)',
                border: '1px solid var(--nf-border, #35464E)',
                color: 'var(--nf-text, #F2F6F8)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Color theme
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectColor(c)}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center relative"
                  style={{
                    background: c,
                    boxShadow: selectedColor === c ? `0 0 0 2px var(--nf-bg), 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Assign Team Members & Roles */}
          <div className="pt-3 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                <Users size={14} className="text-orange-400" />
                Assign Team Members &amp; Roles
              </label>
              <span className="text-[10px] font-mono text-zinc-400">
                {Object.keys(selectedMembers).length} selected
              </span>
            </div>

            <div
              className="max-h-48 overflow-y-auto space-y-2 p-2.5 rounded-xl border divide-y divide-white/5"
              style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
            >
              {teamMembers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center font-mono">
                  No other members registered yet.
                </p>
              ) : (
                teamMembers.map((m) => {
                  const isSelected = Boolean(selectedMembers[m.id]);
                  const selection = selectedMembers[m.id];
                  const hasUnassignedRole = m.role === 'role_not_assigned' || !m.role;

                  return (
                    <div
                      key={m.id}
                      className={`pt-2 first:pt-0 pb-2 flex flex-col gap-2 ${
                        isSelected ? 'bg-orange-500/5 -mx-1 px-2 rounded-lg' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(m)}
                            className="rounded border-zinc-700 text-orange-500 focus:ring-0 w-3.5 h-3.5"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                              {m.full_name}
                              {hasUnassignedRole && (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Role Not Assigned
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">{m.email}</p>
                          </div>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">Project:</span>
                            <select
                              value={selection.projectRole}
                              onChange={(e) => updateProjectRole(m.id, e.target.value as any)}
                              className="h-7 rounded-lg bg-zinc-900 border border-zinc-700 px-2 text-[11px] font-mono text-zinc-200 outline-none"
                            >
                              <option value="lead">Team Lead</option>
                              <option value="member">Member</option>
                              <option value="client">Client</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {isSelected && hasUnassignedRole && (
                        <div className="flex items-center justify-between gap-2 pl-6 py-1 bg-amber-500/10 rounded-lg px-2 border border-amber-500/20">
                          <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                            <AlertCircle size={11} /> Assign Workspace Role:
                          </span>
                          <select
                            value={selection.workspaceRole || 'member'}
                            onChange={(e) => updateWorkspaceRole(m.id, e.target.value)}
                            className="h-6 rounded bg-zinc-900 border border-amber-500/40 px-2 text-[10px] font-mono text-amber-200 outline-none font-semibold"
                          >
                            <option value="member">Team Member</option>
                            <option value="project_manager">Team Lead</option>
                            <option value="client">Client</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                Start date
              </label>
              <input
                {...register('start_date')}
                type="date"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: 'var(--nf-card, #1C2A31)',
                  border: '1px solid var(--nf-border, #35464E)',
                  color: 'var(--nf-text, #F2F6F8)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                Target completion date
              </label>
              <input
                {...register('end_date')}
                type="date"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: 'var(--nf-card, #1C2A31)',
                  border: '1px solid var(--nf-border, #35464E)',
                  color: 'var(--nf-text, #F2F6F8)',
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating project…
                </>
              ) : (
                'Create project'
              )}
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors border"
              style={{ borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text-muted, #AAB8C0)' }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
