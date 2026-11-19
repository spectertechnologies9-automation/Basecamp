'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, MoreHorizontal, UserCheck, UserX, Crown, Shield, User, KeyRound } from 'lucide-react';
import { ROLE_LABELS, ROLE_HIERARCHY } from '@/lib/constants';
import { formatTimeAgo } from '@/lib/utils';
import type { UserRole } from '@/types';

interface Member {
  id: string;
  role: UserRole;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    is_active: boolean;
    last_seen_at?: string;
    created_at: string;
  };
}

interface PeopleViewProps {
  members: Member[];
  currentUserId: string;
  orgId: string;
}

const ROLE_ICON: Record<string, React.FC<any>> = {
  super_admin: Crown,
  owner: Crown,
  admin: Shield,
  project_manager: UserCheck,
  member: User,
  client: User,
  observer: User,
};

export function PeopleView({ members: initialMembers, currentUserId, orgId }: PeopleViewProps) {
  const [memberList, setMemberList] = useState(initialMembers);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [invitePassword, setInvitePassword] = useState('Password123!');
  const [inviting, setInviting] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Sync with real SQLite database on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/users')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (isMounted && json?.data && Array.isArray(json.data)) {
          const mapped = json.data.map((u: any) => ({
            id: `mem_${u.id}`,
            role: u.role,
            user: {
              id: u.id,
              full_name: u.full_name,
              email: u.email,
              avatar_url: u.avatar_url,
              is_active: Boolean(u.is_active),
              last_seen_at: u.last_seen_at,
              created_at: u.created_at,
            },
          }));
          setMemberList(mapped);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = memberList.filter(m => {
    if (filter === 'active') return m.user.is_active;
    if (filter === 'inactive') return !m.user.is_active;
    return true;
  });

  const handleRevoke = async (userId: string, userName: string) => {
    if (!confirm(`Revoke workspace access for ${userName}? They will be immediately blocked from logging in.`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'revoke' }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to revoke access');
        return;
      }
      setMemberList(prev => prev.map(m => m.user.id === userId ? { ...m, user: { ...m.user, is_active: false } } : m));
      setActionMsg(`Access revoked for ${userName}`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch {
      alert('Network request failed');
    }
  };

  const handleRestore = async (userId: string, userName: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'restore' }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to restore access');
        return;
      }
      setMemberList(prev => prev.map(m => m.user.id === userId ? { ...m, user: { ...m.user, is_active: true } } : m));
      setActionMsg(`Access restored for ${userName}`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch {
      alert('Network request failed');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole, userName: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'role', role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to update role');
        return;
      }
      setMemberList((prev) =>
        prev.map((m) => (m.user.id === userId ? { ...m, role: newRole } : m))
      );
      setActionMsg(`Assigned role ${ROLE_LABELS[newRole] || newRole} to ${userName}`);
      setTimeout(() => setActionMsg(null), 4000);
    } catch {
      alert('Network request failed');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setInviting(true);
    try {
      const res = await fetch('/api/team/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          password: invitePassword || 'Password123!',
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setMemberList((prev) => [
          ...prev,
          {
            id: `mem_${json.data.id}`,
            role: json.data.role,
            user: {
              id: json.data.id,
              full_name: json.data.full_name,
              email: json.data.email,
              is_active: true,
              created_at: json.data.created_at,
            },
          },
        ]);
        setActionMsg(`Account created for ${json.data.full_name} (${json.data.email})`);
        setTimeout(() => setActionMsg(null), 4000);
        setInviteName('');
        setInviteEmail('');
        setInvitePassword('Password123!');
        setShowInvite(false);
      } else {
        alert(json.error || 'Failed to create user');
      }
    } catch {
      alert('Network error creating user');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-full p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={22} style={{ color: 'var(--nf-accent)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text)' }}>People &amp; Permissions</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--nf-card)', color: 'var(--nf-text-muted)' }}>
            {memberList.length} members
          </span>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
        >
          <Mail size={15} />
          Invite people
        </button>
      </div>

      {actionMsg && (
        <div className="mb-4 p-3 rounded-xl text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300">
          {actionMsg}
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4 shadow-2xl" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--nf-text)' }}>Create &amp; Invite Member</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Add a new user directly to the workspace database.</p>
            </div>

            <div>
              <label className="block text-xs font-mono mb-1 text-zinc-300">Full Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Jordan Smith"
                autoFocus
                className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono mb-1 text-zinc-300">Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jordan@specteros.agency"
                className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-zinc-900 border border-zinc-700 text-zinc-100 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono mb-1 text-zinc-300">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-zinc-900 border border-zinc-700 text-zinc-100 cursor-pointer"
                >
                  <option value="admin">Administrator</option>
                  <option value="project_manager">Team Lead</option>
                  <option value="member">Member</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono mb-1 text-zinc-300">Password</label>
                <input
                  type="text"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Password123!"
                  className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-zinc-900 border border-zinc-700 text-zinc-100"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowInvite(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim() || !inviteName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
              >
                {inviting ? 'Saving to Database…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg w-fit" style={{ background: 'var(--nf-card)' }}>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-md text-sm capitalize transition-colors"
            style={{
              background: filter === f ? 'var(--nf-card-raised)' : 'transparent',
              color: filter === f ? 'var(--nf-text)' : 'var(--nf-text-muted)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Member table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--nf-border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--nf-card)', borderBottom: '1px solid var(--nf-border)' }}>
              {['Name', 'Role', 'Last active', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nf-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const RoleIcon = ROLE_ICON[m.role] ?? User;
              return (
                <tr
                  key={m.id}
                  className="border-b hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--nf-border)', background: 'var(--nf-panel)' }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'var(--nf-card)', color: 'var(--nf-accent)' }}
                      >
                        {m.user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--nf-text)' }}>
                          {m.user.full_name}
                          {m.user.id === currentUserId && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--nf-accent)22', color: 'var(--nf-accent)' }}>you</span>
                          )}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--nf-text-muted)' }}>{m.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <RoleIcon size={12} style={{ color: 'var(--nf-text-muted)' }} />
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleRoleChange(m.user.id, e.target.value as UserRole, m.user.full_name)
                        }
                        className="bg-zinc-900 border border-zinc-700 text-xs rounded-lg px-2 py-1 text-zinc-200 font-mono outline-none cursor-pointer hover:border-orange-500 transition-colors"
                      >
                        <option value="admin">Administrator</option>
                        <option value="project_manager">Team Lead</option>
                        <option value="member">Member</option>
                        <option value="client">Client</option>
                        <option value="role_not_assigned">Role Not Assigned</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: 'var(--nf-text-muted)' }}>
                      {m.user.last_seen_at ? formatTimeAgo(m.user.last_seen_at) : 'Never'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: m.user.is_active ? 'rgba(57,198,174,0.15)' : 'rgba(170,184,192,0.1)',
                        color: m.user.is_active ? 'var(--nf-accent)' : 'var(--nf-text-muted)',
                      }}
                    >
                      {m.user.is_active ? <UserCheck size={10} /> : <UserX size={10} />}
                      {m.user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.user.id !== currentUserId && (
                      m.user.is_active ? (
                        <button
                          onClick={() => handleRevoke(m.user.id, m.user.full_name)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-colors inline-flex items-center gap-1"
                          title="Revoke workspace access immediately"
                        >
                          <UserX size={12} /> Revoke Access
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestore(m.user.id, m.user.full_name)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 transition-colors inline-flex items-center gap-1"
                          title="Restore workspace access"
                        >
                          <UserCheck size={12} /> Restore Access
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center" style={{ background: 'var(--nf-panel)' }}>
            <p className="text-sm" style={{ color: 'var(--nf-text-muted)' }}>No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
