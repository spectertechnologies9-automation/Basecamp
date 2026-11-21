'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Search,
  X,
  Check,
  Loader2,
  Trash2,
  CheckCircle2,
  FolderKanban,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { formatTimeAgo, getAvatarColor, getInitials } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';

export function TeamDirectoryView({ initialMembers }: any) {
  const [members, setMembers] = useState<any[]>(initialMembers || []);
  const [search, setSearch] = useState('');
  const [inviteModal, setInviteModal] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sync with real SQLite database on mount + localStorage persistent registry
  useEffect(() => {
    let isMounted = true;
    fetch('/api/team/members')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!isMounted) return;
        let list: any[] = [];
        if (json?.data && Array.isArray(json.data)) {
          list = json.data;
        }

        // Merge persistent registered users from localStorage
        try {
          const stored = localStorage.getItem('specter_registered_users');
          if (stored) {
            const registered = JSON.parse(stored);
            for (const reg of registered) {
              if (
                reg.role !== 'super_admin' &&
                reg.email !== 'superadmin@specteros.agency' &&
                !list.some((m: any) => m.id === reg.id || m.email?.toLowerCase() === reg.email?.toLowerCase())
              ) {
                list.push({
                  id: reg.id,
                  full_name: reg.full_name || reg.email.split('@')[0],
                  email: reg.email,
                  role: reg.role || 'role_not_assigned',
                  avatar_url: reg.avatar_url,
                  is_active: reg.is_active !== false,
                  contributions: {
                    tasks_completed: 0,
                    projects_count: 0,
                    comments_count: 0,
                  },
                });
              }
            }
          }
        } catch {}

        setMembers(list.filter((m: any) => m.role !== 'super_admin' && m.email !== 'superadmin@specteros.agency'));
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [password, setPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filtered = members.filter((m) =>
    (m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          role,
          password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to add member');
        return;
      }

      if (json.data) {
        setMembers((prev) => [...prev, json.data]);
        try {
          const stored = localStorage.getItem('specter_registered_users');
          const reg = stored ? JSON.parse(stored) : [];
          reg.push({
            id: json.data.id,
            full_name: json.data.full_name,
            email: json.data.email,
            role: json.data.role,
            password: password || 'Password123!',
            is_active: true,
            created_at: json.data.created_at,
          });
          localStorage.setItem('specter_registered_users', JSON.stringify(reg));
        } catch {}
        setFullName('');
        setEmail('');
        setInviteModal(false);
        setSuccessMsg(`Team member ${json.data.full_name} added successfully!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch {
      setError('Connection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteConfirmUser) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/team/members?id=${deleteConfirmUser.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) {
        alert(json.error || 'Could not remove member');
        return;
      }

      setMembers((prev) => prev.filter((m) => m.id !== deleteConfirmUser.id));
      try {
        const stored = localStorage.getItem('specter_registered_users');
        if (stored) {
          const reg = JSON.parse(stored).filter((u: any) => u.id !== deleteConfirmUser.id);
          localStorage.setItem('specter_registered_users', JSON.stringify(reg));
        }
      } catch {}
      setSuccessMsg(`Member ${deleteConfirmUser.full_name} removed`);
      setDeleteConfirmUser(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      alert('Failed to remove member');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sky-400 bg-sky-500/10">
            <Users size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Team Directory &amp; Roster
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400">
                {members.length} Members
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Add, manage, and view contribution stats for your workspace team
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setError(null);
            setInviteModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity self-start sm:self-center"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          <UserPlus size={14} /> Add Team Member
        </button>
      </div>

      {successMsg && (
        <div className="p-3 mb-6 rounded-2xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} />
          {successMsg}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Filter members by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
          style={{
            background: 'var(--nf-card, #1C2A31)',
            border: '1px solid var(--nf-border, #35464E)',
            color: 'var(--nf-text, #F2F6F8)',
          }}
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((member) => {
          const color = getAvatarColor(member.id);
          const tasksCount = member.contributions?.tasks_completed ?? 0;
          const projectsCount = member.contributions?.projects_count ?? 0;
          const commentsCount = member.contributions?.comments_count ?? 0;

          return (
            <div
              key={member.id}
              className="p-5 rounded-2xl border flex flex-col justify-between group transition-all hover:border-slate-500"
              style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: color + '25', color }}
                  >
                    {getInitials(member.full_name || 'U')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: member.role === 'owner' ? 'rgba(233,172,87,0.15)' : 'rgba(57,198,174,0.15)',
                        color: member.role === 'owner' ? '#E9AC57' : 'var(--nf-accent, #39C6AE)',
                      }}
                    >
                      {ROLE_LABELS[member.role] || member.role}
                    </span>

                    {/* Remove Member Trigger (hidden for owner) */}
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => setDeleteConfirmUser(member)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove member from workspace"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold mb-0.5" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  {member.full_name}
                </h3>
                <p className="text-xs truncate flex items-center gap-1.5 mb-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  <Mail size={12} /> {member.email}
                </p>

                {/* Contribution stats pill */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-black/25 border border-white/5 text-center mb-3">
                  <div>
                    <span className="block text-xs font-bold text-white">{tasksCount}</span>
                    <span className="text-[9px] text-slate-400">Tasks</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-teal-300">{projectsCount}</span>
                    <span className="text-[9px] text-slate-400">Projects</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-sky-300">{commentsCount}</span>
                    <span className="text-[9px] text-slate-400">Comments</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text-muted, #AAB8C0)' }}>
                <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal to Remove Member */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl border bg-slate-900 border-rose-500/30 text-white shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-base font-bold mb-1">Remove Team Member?</h3>
            <p className="text-xs text-slate-300 mb-6">
              Are you sure you want to remove <strong>{deleteConfirmUser.full_name}</strong> ({deleteConfirmUser.email}) from the workspace? They will lose access to all projects and tasks.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteMember}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1.5"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 rounded-3xl border shadow-2xl relative"
            style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Add New Team Member
              </h2>
              <button onClick={() => setInviteModal(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl text-xs bg-red-500/10 border border-red-500/30 text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs outline-none capitalize"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                >
                  <option value="member">Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Administrator</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Initial Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs outline-none font-mono"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs"
                  style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
