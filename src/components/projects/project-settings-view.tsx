'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Check, Loader2, Trash2, Users, UserPlus, Shield, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRolePreview } from '@/hooks/use-role-preview';

export function ProjectSettingsView({ project, canEdit }: any) {
  const router = useRouter();
  const { previewRole } = useRolePreview();
  const isAdmin = !previewRole || previewRole === 'admin' || (previewRole as string) === 'owner';

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status || 'active');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Members state
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedAddUserId, setSelectedAddUserId] = useState('');
  const [selectedAddRole, setSelectedAddRole] = useState<'lead' | 'member' | 'client'>('member');
  const [memberLoading, setMemberLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/members`);
      if (res.ok) {
        const json = await res.json();
        setMembers(json.data || []);
      }
    } catch {}
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/team/members');
      if (res.ok) {
        const json = await res.json();
        setAllUsers(json.data || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMembers();
    fetchAllUsers();
  }, [project.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
        }),
      });

      if (res.ok) {
        setMessage('Changes saved successfully.');
        router.refresh();
      }
    } catch {
      setMessage('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/members?user_id=${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddUserId) return;
    setMemberLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedAddUserId, role: selectedAddRole }),
      });
      if (res.ok) {
        setSelectedAddUserId('');
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      alert('Only administrators can delete projects.');
      return;
    }

    if (!confirm('Are you sure you want to permanently delete this project? All tasks, chat messages, and documents will be deleted.')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/projects');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-full p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <Link href={`/projects/${project.id}`} className="hover:opacity-70" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
          <ArrowLeft size={16} />
        </Link>
        <Settings size={18} style={{ color: 'var(--nf-accent, #39C6AE)' }} />
        <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
          Project Settings · {project.name}
        </h1>
      </div>

      {!canEdit ? (
        <p className="text-sm" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
          You don&apos;t have permission to edit this project.
        </p>
      ) : (
        <div className="space-y-6">
          {/* General Information Form */}
          <form onSubmit={handleSave} className="p-6 rounded-2xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              General Information
            </h2>

            {message && (
              <div className="p-3 mb-4 rounded-xl text-xs font-semibold" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
                {message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-sm outline-none capitalize"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Save Changes
              </button>
            </div>
          </form>

          {/* Project Team & Role Assignment Section */}
          <div className="p-6 rounded-2xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users size={16} className="text-orange-400" />
                  Project Team &amp; Roles
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Assign project-specific roles: Team Lead (Full access), Member, or Client.
                </p>
              </div>
            </div>

            {/* Existing Members List */}
            <div className="space-y-2 mb-6">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center font-bold text-white text-[10px]">
                      {m.full_name ? m.full_name[0] : 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{m.full_name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{m.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                      className="h-8 rounded-lg bg-zinc-900 border border-zinc-700 px-2 text-xs font-mono text-zinc-200 outline-none"
                    >
                      <option value="lead">Team Lead</option>
                      <option value="member">Member</option>
                      <option value="client">Client</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.user_id)}
                      title="Remove member"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Member to Project */}
            <form onSubmit={handleAddMember} className="flex items-center gap-2 pt-3 border-t border-zinc-800">
              <select
                value={selectedAddUserId}
                onChange={(e) => setSelectedAddUserId(e.target.value)}
                className="flex-1 h-9 rounded-xl bg-zinc-950 border border-zinc-800 px-3 text-xs font-mono text-zinc-200 outline-none"
              >
                <option value="">Select workspace user to add...</option>
                {allUsers
                  .filter((u) => !members.some((m) => m.user_id === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
              </select>

              <select
                value={selectedAddRole}
                onChange={(e) => setSelectedAddRole(e.target.value as any)}
                className="w-32 h-9 rounded-xl bg-zinc-950 border border-zinc-800 px-2 text-xs font-mono text-zinc-200 outline-none"
              >
                <option value="member">Member</option>
                <option value="lead">Team Lead</option>
                <option value="client">Client</option>
              </select>

              <button
                type="submit"
                disabled={!selectedAddUserId || memberLoading}
                className="h-9 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <UserPlus size={13} />
                Add
              </button>
            </form>
          </div>

          {/* Danger Zone — Accessible ONLY to Admins */}
          {isAdmin && (
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'rgba(229,107,112,0.3)' }}>
              <h2 className="text-sm font-bold mb-1 flex items-center gap-1.5" style={{ color: '#E56B70' }}>
                <Shield size={14} /> Danger Zone (Admin Only)
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                Deleting a project removes all associated tasks, channels, documents, and logs permanently. Only system administrators can perform this action.
              </p>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border hover:bg-red-500/10 transition-colors"
                style={{ borderColor: '#E56B70', color: '#E56B70' }}
              >
                <Trash2 size={14} /> Delete Project Permanently
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
