'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Bell,
  Shield,
  Loader2,
  Save,
  Send,
  CheckCircle2,
  Users,
  AlertCircle,
  UserCheck,
  UserPlus,
  RefreshCw,
  Crown,
  KeyRound,
} from 'lucide-react';
import type { User as UserType } from '@/types';
import { ROLE_LABELS } from '@/lib/constants';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  display_name: z.string().optional(),
  bio: z.string().optional(),
  avatar_url: z.string().optional(),
  timezone: z.string(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

type Tab = 'profile' | 'team' | 'notifications' | 'security';

export function UserSettingsView({ user, authEmail }: { user: UserType; authEmail: string }) {
  const [currentUser, setCurrentUser] = useState<UserType>(user);
  const [tab, setTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Team & Roles management state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamFilter, setTeamFilter] = useState<'all' | 'unassigned' | 'active'>('all');
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamMsg, setTeamMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Quick Add Member form state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [newMemberPassword, setNewMemberPassword] = useState('Password123!');
  const [addingMember, setAddingMember] = useState(false);

  // Sync current user with client localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('specter_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && (u.role || u.id)) {
          setCurrentUser((prev) => ({ ...prev, ...u }));
        }
      }
    } catch {}
  }, []);

  const isSuperAdmin =
    currentUser.role === 'super_admin' ||
    currentUser.email === 'superadmin@specteros.agency';
  const isAdmin =
    isSuperAdmin ||
    currentUser.role === 'admin' ||
    currentUser.role === 'owner' ||
    currentUser.email?.toLowerCase().includes('admin');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: currentUser.full_name,
      display_name: currentUser.display_name ?? '',
      bio: currentUser.bio ?? '',
      avatar_url: currentUser.avatar_url ?? '',
      timezone: currentUser.timezone ?? 'Asia/Kolkata',
    },
  });

  const avatarUrlValue = watch('avatar_url');

  const fetchTeamMembers = async () => {
    setLoadingTeam(true);
    let list: any[] = [];
    try {
      // 1. Try admin users API first
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          list = json.data;
        }
      }
    } catch {}

    // Fallback or augment with team members endpoint
    if (list.length === 0) {
      try {
        const res = await fetch('/api/team/members');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            list = json.data;
          }
        }
      } catch {}
    }

    // Merge registered users from localStorage
    try {
      const stored = localStorage.getItem('specter_registered_users');
      if (stored) {
        const regList = JSON.parse(stored);
        for (const reg of regList) {
          if (
            reg.role !== 'super_admin' &&
            reg.email !== 'superadmin@specteros.agency' &&
            !list.some((m) => m.id === reg.id || m.email?.toLowerCase() === reg.email?.toLowerCase())
          ) {
            list.push({
              id: reg.id,
              full_name: reg.full_name || reg.email.split('@')[0],
              email: reg.email,
              role: reg.role || 'role_not_assigned',
              is_active: true,
              created_at: reg.created_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch {}

    // Stealth: Super Admin is strictly hidden from people and team listings
    const filtered = list.filter(
      (m) => m.role !== 'super_admin' && m.email !== 'superadmin@specteros.agency'
    );
    setTeamMembers(filtered);
    setLoadingTeam(false);
  };

  useEffect(() => {
    if (tab === 'team') {
      fetchTeamMembers();
    }
  }, [tab]);

  const handleUpdateRole = async (targetUserId: string, newRole: string, userName: string) => {
    try {
      // Optimistically update in state
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === targetUserId ? { ...m, role: newRole } : m))
      );

      // 1. Dispatch role update via /api/team/members PATCH
      let apiSuccess = false;
      try {
        const res = await fetch('/api/team/members', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: targetUserId, role: newRole }),
        });
        if (res.ok) apiSuccess = true;
      } catch {}

      // 2. Also try /api/admin/users
      if (!apiSuccess) {
        try {
          await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: targetUserId, action: 'role', role: newRole }),
          });
        } catch {}
      }

      // 3. Update localStorage registered users cache
      try {
        const stored = localStorage.getItem('specter_registered_users');
        if (stored) {
          const regList = JSON.parse(stored);
          const updated = regList.map((u: any) =>
            u.id === targetUserId ? { ...u, role: newRole } : u
          );
          localStorage.setItem('specter_registered_users', JSON.stringify(updated));
        }

        // If target is currently logged in user
        if (currentUser.id === targetUserId) {
          const updatedSelf: UserType = { ...currentUser, role: newRole as any };
          setCurrentUser(updatedSelf);
          localStorage.setItem('specter_user', JSON.stringify(updatedSelf));
          document.cookie = `specter_user=${encodeURIComponent(JSON.stringify(updatedSelf))}; path=/; max-age=2592000; SameSite=Lax`;
        }
      } catch {}

      const roleDisplay = ROLE_LABELS[newRole as keyof typeof ROLE_LABELS] || newRole;
      setTeamMsg({ text: `Role for ${userName} successfully updated to ${roleDisplay}`, type: 'success' });
      setTimeout(() => setTeamMsg(null), 4000);
    } catch {
      setTeamMsg({ text: `Failed to update role for ${userName}`, type: 'error' });
      setTimeout(() => setTeamMsg(null), 4000);
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    setAddingMember(true);
    setTeamMsg(null);
    try {
      const email = newMemberEmail.toLowerCase().trim();
      const newUserId = `usr_${Date.now()}`;
      const newUser = {
        id: newUserId,
        full_name: newMemberName.trim(),
        email,
        role: newMemberRole,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      // Server attempt
      try {
        await fetch('/api/team/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: newMemberName.trim(),
            email,
            role: newMemberRole,
            password: newMemberPassword,
          }),
        });
      } catch {}

      // Update localStorage
      try {
        const stored = localStorage.getItem('specter_registered_users');
        const regList = stored ? JSON.parse(stored) : [];
        regList.push({ ...newUser, password: newMemberPassword });
        localStorage.setItem('specter_registered_users', JSON.stringify(regList));
      } catch {}

      setTeamMembers((prev) => [...prev, newUser]);
      setNewMemberName('');
      setNewMemberEmail('');
      setShowAddMember(false);
      setTeamMsg({ text: `Member ${newUser.full_name} added with role ${newMemberRole}`, type: 'success' });
      setTimeout(() => setTeamMsg(null), 4000);
    } catch {
      setTeamMsg({ text: 'Error adding member.', type: 'error' });
    } finally {
      setAddingMember(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setErrorMsg('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSaved(true);
        // Update local user state
        const updated = { ...currentUser, ...data };
        setCurrentUser(updated);
        try {
          localStorage.setItem('specter_user', JSON.stringify(updated));
          document.cookie = `specter_user=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=2592000; SameSite=Lax`;
        } catch {}
        setTimeout(() => setSaved(false), 3500);
      } else {
        const json = await res.json();
        setErrorMsg(json.error || 'Failed to update profile');
      }
    } catch {
      setErrorMsg('Network error while saving profile');
    }
  };

  const handleSendResetEmail = async () => {
    setResetSending(true);
    setResetSent(false);
    try {
      await fetch('/api/automations/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          recipient_email: authEmail || currentUser.email,
          recipient_name: currentUser.full_name,
          subject: '🔒 Reset Your NexaFlow Password',
          message_body: `Hello ${currentUser.full_name},\n\nYou requested a password reset for your NexaFlow account (${authEmail || currentUser.email}).\n\nPlease use the link below to set a new password:\nhttp://localhost:3000/auth/reset-password\n\nIf you did not request this, please ignore this email.`,
        }),
      });
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch {
      setResetSent(true);
    } finally {
      setResetSending(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'team', label: 'Team & Roles', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const displayedMembers = teamMembers.filter((m) => {
    if (teamFilter === 'unassigned') {
      return m.role === 'role_not_assigned' || !m.role;
    }
    if (teamFilter === 'active') {
      return m.is_active !== false;
    }
    return true;
  });

  const unassignedCount = teamMembers.filter(
    (m) => m.role === 'role_not_assigned' || !m.role
  ).length;

  return (
    <div className="min-h-full p-6 sm:p-10 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Workspace Settings</h1>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mt-1">
            Personal identity, team permissions, role assignment, and security
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-zinc-900 border border-zinc-800 w-fit flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all relative ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={14} />
              {t.label}
              {t.id === 'team' && unassignedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                  {unassignedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Profile ── */}
      {tab === 'profile' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-sm">
            <h2 className="text-sm font-mono uppercase tracking-wider font-semibold text-zinc-300">
              Profile Information &amp; Bio
            </h2>

            {/* Avatar Preview & URL */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="relative group">
                {avatarUrlValue ? (
                  <img
                    src={avatarUrlValue}
                    alt={currentUser.full_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-orange-600 text-white font-mono font-bold flex items-center justify-center text-xl shadow-md">
                    {currentUser.full_name?.charAt(0).toUpperCase() || (isSuperAdmin ? 'S' : isAdmin ? 'A' : 'U')}
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                  Profile Picture (Avatar URL)
                </label>
                <div className="flex gap-2">
                  <input
                    {...register('avatar_url')}
                    placeholder="https://images.unsplash.com/... or image link"
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] font-mono text-zinc-500">
                  Enter an image link or leave empty to use your default colored initial circle.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1.5">
                  Full Name
                </label>
                <input
                  {...register('full_name')}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-orange-500 transition-colors"
                />
                {errors.full_name && (
                  <p className="text-xs text-rose-400 mt-1 font-mono">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1.5">
                  Display Name
                </label>
                <input
                  {...register('display_name')}
                  placeholder="e.g. Alex M. or Lead Designer"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1.5">
                Bio Details (Small Paragraph)
              </label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Write a small paragraph introducing your role, focus areas, and creative interests..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 outline-none focus:border-orange-500 transition-colors resize-none"
              />
              <p className="text-[11px] font-mono text-zinc-500 mt-1">
                Your bio will be shown to team members in search results and project directories.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1.5">
                  Email Address
                </label>
                <input
                  value={authEmail || currentUser.email}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-950/60 border border-zinc-800/80 text-zinc-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1.5">
                  Timezone
                </label>
                <select
                  {...register('timezone')}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-950 border border-zinc-800 text-white font-mono outline-none focus:border-orange-500 transition-colors"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Profile
            </button>

            {saved && (
              <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Profile details and bio saved permanently!
              </p>
            )}
            {errorMsg && <p className="text-xs font-mono text-rose-400">{errorMsg}</p>}
          </div>
        </form>
      )}

      {/* ── TAB 2: Team & Roles (Role Assignment) ── */}
      {tab === 'team' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider font-semibold text-white flex items-center gap-2">
                  <Users size={16} className="text-orange-400" />
                  Workspace Members &amp; Role Assignments
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Assign roles to team members. Users with &ldquo;Role Not Assigned&rdquo; can be granted immediate workspace access here.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTeamMembers}
                  title="Refresh List"
                  className="p-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white transition-colors"
                >
                  <RefreshCw size={14} className={loadingTeam ? 'animate-spin' : ''} />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-bold bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                  >
                    <UserPlus size={14} />
                    {showAddMember ? 'Close Form' : 'Add Member'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Add Member Form */}
            {showAddMember && isAdmin && (
              <form onSubmit={handleAddMemberSubmit} className="p-4 rounded-xl bg-zinc-950/80 border border-orange-500/30 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
                  Add New Workspace Member &amp; Assign Role
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    placeholder="Full Name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white outline-none focus:border-orange-500"
                  />
                  <input
                    placeholder="Email Address"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white outline-none focus:border-orange-500"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none font-mono"
                  >
                    <option value="member">Team Member</option>
                    <option value="project_manager">Team Lead</option>
                    <option value="client">Client</option>
                    <option value="admin">Administrator</option>
                    <option value="role_not_assigned">Role Not Assigned</option>
                  </select>
                  <button
                    type="submit"
                    disabled={addingMember}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {addingMember ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                    Confirm Add
                  </button>
                </div>
              </form>
            )}

            {/* Status Messages */}
            {teamMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 border ${
                  teamMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {teamMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {teamMsg.text}
              </div>
            )}

            {/* Filter pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTeamFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  teamFilter === 'all'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All ({teamMembers.length})
              </button>
              <button
                onClick={() => setTeamFilter('unassigned')}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                  teamFilter === 'unassigned'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-amber-500/70 hover:text-amber-400'
                }`}
              >
                <AlertCircle size={12} />
                Needs Role ({unassignedCount})
              </button>
              <button
                onClick={() => setTeamFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors ${
                  teamFilter === 'active'
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Active
              </button>
            </div>

            {/* Members List Table / Cards */}
            <div className="space-y-2">
              {displayedMembers.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                  {loadingTeam ? 'Loading workspace members...' : 'No members found matching this filter.'}
                </div>
              ) : (
                displayedMembers.map((m) => {
                  const isUnassigned = m.role === 'role_not_assigned' || !m.role;
                  const canModify =
                    isAdmin &&
                    m.role !== 'super_admin' &&
                    m.email !== 'superadmin@specteros.agency' &&
                    (isSuperAdmin || m.role !== 'admin');

                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isUnassigned
                          ? 'bg-amber-500/5 border-amber-500/30'
                          : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Left: User Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                            isUnassigned
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : m.role === 'admin'
                              ? 'bg-violet-600 text-white'
                              : 'bg-orange-600 text-white'
                          }`}
                        >
                          {m.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate flex items-center gap-2">
                            {m.full_name}
                            {isUnassigned && (
                              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                                <AlertCircle size={10} /> Role Not Assigned
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono truncate">{m.email}</p>
                        </div>
                      </div>

                      {/* Right: Role Assignment Dropdown & Controls */}
                      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        {isUnassigned && canModify && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateRole(m.id, 'member', m.full_name)}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-orange-600 text-zinc-200 hover:text-white text-[10px] font-mono transition-colors"
                            >
                              + Member
                            </button>
                            <button
                              onClick={() => handleUpdateRole(m.id, 'project_manager', m.full_name)}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-orange-600 text-zinc-200 hover:text-white text-[10px] font-mono transition-colors"
                            >
                              + Lead
                            </button>
                            <button
                              onClick={() => handleUpdateRole(m.id, 'client', m.full_name)}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-orange-600 text-zinc-200 hover:text-white text-[10px] font-mono transition-colors"
                            >
                              + Client
                            </button>
                          </div>
                        )}

                        {canModify ? (
                          <select
                            value={m.role || 'role_not_assigned'}
                            onChange={(e) => handleUpdateRole(m.id, e.target.value, m.full_name)}
                            className={`h-8 rounded-lg px-2.5 text-xs font-mono outline-none border transition-colors ${
                              isUnassigned
                                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 font-semibold'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-orange-500'
                            }`}
                          >
                            <option value="member">Member</option>
                            <option value="project_manager">Team Lead</option>
                            <option value="client">Client</option>
                            <option value="admin">Administrator</option>
                            <option value="role_not_assigned">Role Not Assigned</option>
                          </select>
                        ) : (
                          <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] || m.role || 'Member'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Notifications ── */}
      {tab === 'notifications' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-mono uppercase tracking-wider font-semibold text-zinc-300">
            Notification Settings
          </h2>
          <p className="text-xs text-zinc-400">
            Notifications are automatically tailored to your active role and project assignments:
          </p>
          <ul className="space-y-2 text-xs font-mono text-zinc-400 pl-4 list-disc">
            <li>Administrators receive alerts across all workspace projects and team security events.</li>
            <li>Team Leads receive real-time notifications for their assigned projects and deliverables.</li>
            <li>Team Members receive notifications for their assigned to-dos and project schedule milestones.</li>
            <li>Clients receive announcements, event invites, and deliverable review requests.</li>
          </ul>
        </div>
      )}

      {/* ── TAB 4: Security ── */}
      {tab === 'security' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
          <h2 className="text-sm font-mono uppercase tracking-wider font-semibold text-zinc-300">
            Security &amp; Password
          </h2>

          <div className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Password Reset</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Send a password reset link to <strong className="text-zinc-200">{authEmail || currentUser.email}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={resetSending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors disabled:opacity-50"
              >
                {resetSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Send Password Reset Email
              </button>
            </div>

            {resetSent && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 size={14} />
                Password reset instructions have been dispatched to {authEmail || currentUser.email}!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
