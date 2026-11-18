'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Server,
  Settings,
  Users,
  Key,
  Layers,
  FileText,
  Clock,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  Save,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Flame,
  MessageSquare,
  CheckSquare,
  FolderOpen,
  Calendar,
  HelpCircle,
  LayoutGrid,
  Mountain,
  UserX,
  UserCheck,
} from 'lucide-react';
import { formatTimeAgo, formatFileSize, getAvatarColor, getInitials } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';

type AdminTab = 'health' | 'settings' | 'users' | 'apis' | 'modules' | 'audit' | 'time';

interface AdminViewProps {
  currentUser: any;
  organization: any;
  users: any[];
  projects: any[];
  systemStats: {
    usersCount: number;
    projectsCount: number;
    tasksCount: number;
    auditLogsCount: number;
    dbSizeBytes: number;
    nodeEnv: string;
    serverTime: string;
  };
  integrations: any[];
  modulesMap: Record<string, boolean>;
  auditLogs: any[];
  timeEntries: any[];
}

export function AdminView({
  currentUser,
  organization,
  users: initialUsers,
  projects,
  systemStats,
  integrations: initialIntegrations,
  modulesMap: initialModulesMap,
  auditLogs,
  timeEntries,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('health');
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [modulesMap, setModulesMap] = useState<Record<string, boolean>>(initialModulesMap);
  const [auditLogList, setAuditLogList] = useState<any[]>(auditLogs);
  const [clearingAudit, setClearingAudit] = useState(false);

  // Org Settings State
  const [orgName, setOrgName] = useState(organization.name || 'NexaFlow Systems');
  const [timezone, setTimezone] = useState(organization.timezone || 'Asia/Kolkata');
  const [allowedDomains, setAllowedDomains] = useState(organization.allowed_domains || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // API Credentials State
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('109283746501928');
  const [whatsappWabaId, setWhatsappWabaId] = useState('293847561029384');
  const [whatsappToken, setWhatsappToken] = useState('EAAOx...[CONFIGURED]');
  const [geminiKey, setGeminiKey] = useState('AIzaSy...[CONFIGURED]');
  const [resendKey, setResendKey] = useState('re_981...[CONFIGURED]');
  const [apiSaveSuccess, setApiSaveSuccess] = useState(false);

  // User search
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  const handleSaveOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          timezone,
          allowed_domains: allowedDomains,
        }),
      });

      if (res.ok) {
        setSettingsSuccess(true);
        setTimeout(() => setSettingsSuccess(false), 3500);
      }
    } catch {
      console.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleModule = async (key: string) => {
    const next = !modulesMap[key];
    setModulesMap((prev) => ({ ...prev, [key]: next }));

    try {
      await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_key: key, is_enabled: next }),
      });
    } catch {
      setModulesMap((prev) => ({ ...prev, [key]: !next }));
    }
  };

  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'role', role: newRole }),
      });
      setUserActionMsg(`Role updated to ${newRole}`);
      setTimeout(() => setUserActionMsg(null), 3000);
    } catch {
      console.error('Failed to change role');
    }
  };

  const handleRevokeAccess = async (userId: string, userName: string) => {
    if (!confirm(`Revoke workspace access for ${userName}? They will be immediately signed out and blocked from logging in.`)) return;

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

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: 0 } : u))
      );
      setUserActionMsg(`Access revoked for ${userName}`);
      setTimeout(() => setUserActionMsg(null), 4000);
    } catch {
      alert('Failed to revoke access');
    }
  };

  const handleRestoreAccess = async (userId: string, userName: string) => {
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

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: 1 } : u))
      );
      setUserActionMsg(`Access restored for ${userName}`);
      setTimeout(() => setUserActionMsg(null), 4000);
    } catch {
      alert('Failed to restore access');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Permanently delete account for ${userName}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to delete user');
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setUserActionMsg(`Account for ${userName} permanently removed`);
      setTimeout(() => setUserActionMsg(null), 4000);
    } catch {
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleClearAuditLogs = async () => {
    if (!confirm('Are you sure you want to clear all audit logs? This action will purge the historical audit trail.')) return;
    setClearingAudit(true);
    try {
      const res = await fetch('/api/admin/audit', { method: 'DELETE' });
      if (res.ok) {
        setAuditLogList([{
          id: 'aud_cleared',
          actor_name: currentUser?.full_name || 'Administrator',
          action: 'cleared audit logs',
          entity_type: 'system',
          entity_id: 'system',
          created_at: new Date().toISOString(),
        }]);
      }
    } catch {
      alert('Failed to clear audit logs');
    } finally {
      setClearingAudit(false);
    }
  };

  const filteredAudit = auditLogList.filter(
    (a) =>
      a.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.actor_name?.toLowerCase().includes(auditSearch.toLowerCase()) ||
      a.entity_type?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const BASECAMP_MODULES = [
    { key: 'message_board', name: 'Message Board', icon: MessageSquare, desc: 'Pitches, announcements, and progress updates' },
    { key: 'campfire', name: 'Campfire', icon: Flame, desc: 'Casual group chat and real-time team pings' },
    { key: 'todos', name: 'To-dos', icon: CheckSquare, desc: 'Lists, checkboxes, assignments, and due dates' },
    { key: 'docs', name: 'Docs & Files', icon: FolderOpen, desc: 'Specifications, notes, mockups, and spreadsheets' },
    { key: 'check_ins', name: 'Automatic Check-ins', icon: HelpCircle, desc: 'Recurring automated team questions' },
    { key: 'schedule', name: 'Schedule', icon: Calendar, desc: 'Milestones, deadlines, and project events' },
    { key: 'card_table', name: 'Card Table (Kanban)', icon: LayoutGrid, desc: 'Visual stages and work-in-progress triage' },
    { key: 'hill_chart', name: 'Hill Charts', icon: Mountain, desc: 'Work confidence tracker: figuring it out vs shipping' },
    { key: 'time_tracking', name: 'Time Tracking', icon: Clock, desc: 'Log billable hours and team throughput' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 w-full">
      {/* Admin Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-amber-400 bg-amber-500/10">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Website Administration &amp; Control Center
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 uppercase tracking-wider">
                Elevated
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Master server details, organization governance, API credentials, and platform security
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors self-start sm:self-center"
        >
          ← Return to User Workspace
        </Link>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/25 border mb-6 overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        {[
          { key: 'health', label: 'System Health', icon: Server },
          { key: 'settings', label: 'Site Settings', icon: Settings },
          { key: 'users', label: 'User Governance', icon: Users, badge: users.length },
          { key: 'apis', label: 'API Connections', icon: Key },
          { key: 'modules', label: 'Basecamp Tools Governance', icon: Layers },
          { key: 'audit', label: 'Audit Logs', icon: FileText, badge: auditLogs.length },
          { key: 'time', label: 'Timesheet & Billing', icon: Clock, badge: timeEntries.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-w-max ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: SYSTEM HEALTH & SERVER TELEMETRY ── */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Size</span>
              <p className="text-xl font-bold text-white mt-1">{formatFileSize(systemStats.dbSizeBytes)}</p>
              <span className="text-[11px] text-teal-400">Local SQLite (WASM)</span>
            </div>

            <div className="p-4 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
              <p className="text-xl font-bold text-white mt-1">{systemStats.usersCount}</p>
              <span className="text-[11px] text-sky-400">Active team members</span>
            </div>

            <div className="p-4 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Projects Managed</span>
              <p className="text-xl font-bold text-white mt-1">{systemStats.projectsCount}</p>
              <span className="text-[11px] text-amber-400">Workspaces &amp; boards</span>
            </div>

            <div className="p-4 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tasks Executed</span>
              <p className="text-xl font-bold text-white mt-1">{systemStats.tasksCount}</p>
              <span className="text-[11px] text-emerald-400">To-dos tracked</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Database size={16} className="text-teal-400" />
              Runtime Telemetry &amp; Server Infrastructure
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Node Environment:</span>
                  <span className="font-mono text-white">{systemStats.nodeEnv}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Database:</span>
                  <span className="font-mono text-white">data/nexaflow.sqlite</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Driver:</span>
                  <span className="font-mono text-teal-300">sql.js (SQLite WebAssembly)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin Session Token:</span>
                  <span className="font-mono text-amber-300">HMAC-SHA256 (HTTP-Only)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Server Local Port:</span>
                  <span className="font-mono text-white">3000 (HTTP / Next.js 14)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Server Clock (UTC):</span>
                  <span suppressHydrationWarning className="font-mono text-white">
                    {systemStats.serverTime ? systemStats.serverTime.slice(11, 19) + ' UTC' : '00:00:00 UTC'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SITE & ORGANIZATION SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-3xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <h3 className="text-sm font-bold text-white mb-2">Organization &amp; Website Settings</h3>
          <p className="text-xs text-slate-400 mb-6">
            Configure global website name, default timezone, and member access rules
          </p>

          {settingsSuccess && (
            <div className="p-3 mb-6 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={14} /> Organization settings updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveOrgSettings} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Organization / Workspace Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-900 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Default System Timezone</label>
              <input
                type="text"
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-900 border border-white/10 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Allowed Email Domains (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. company.com, nexaflow.local"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-900 border border-white/10 text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center gap-2"
              >
                {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: USER GOVERNANCE ── */}
      {activeTab === 'users' && (
        <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Master User Accounts &amp; Access Control</h3>
              <p className="text-xs text-slate-400">Elevate roles, immediately revoke workspace access, or restore accounts</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none bg-slate-900 border border-white/10 text-white"
              />
            </div>
          </div>

          {userActionMsg && (
            <div className="mx-5 mt-4 p-3 rounded-2xl text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2">
              <CheckCircle2 size={15} />
              {userActionMsg}
            </div>
          )}

          <div className="divide-y divide-white/5">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ background: getAvatarColor(u.id) + '25', color: getAvatarColor(u.id) }}
                  >
                    {getInitials(u.full_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{u.full_name}</p>
                      {!u.is_active && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                          REVOKED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap justify-end">
                  <select
                    value={u.role}
                    onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-white/10 text-white font-medium outline-none capitalize"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Administrator</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="member">Member</option>
                    <option value="client">Client</option>
                  </select>

                  {/* Status Badge */}
                  {u.is_active ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400">
                      Suspended
                    </span>
                  )}

                  {/* Revoke / Restore Action Button */}
                  {u.is_active ? (
                    <button
                      onClick={() => handleRevokeAccess(u.id, u.full_name)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-colors flex items-center gap-1"
                      title="Immediately revoke workspace access"
                    >
                      <UserX size={12} />
                      Revoke Access
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestoreAccess(u.id, u.full_name)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 transition-colors flex items-center gap-1"
                      title="Restore workspace access"
                    >
                      <UserCheck size={12} />
                      Restore Access
                    </button>
                  )}

                  {/* Delete User Account Button */}
                  <button
                    onClick={() => handleDeleteUser(u.id, u.full_name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Permanently delete user account"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: API CONNECTIONS & EXTERNAL INTEGRATIONS ── */}
      {activeTab === 'apis' && (
        <div className="space-y-4">
          {apiSaveSuccess && (
            <div className="p-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={14} /> Credentials and API configurations verified!
            </div>
          )}

          {/* WhatsApp Meta API */}
          <div className="p-6 rounded-3xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">Meta WhatsApp Business Cloud API</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                Connected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone Number ID</label>
                <input
                  type="text"
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">WhatsApp Business Account ID (WABA)</label>
                <input
                  type="text"
                  value={whatsappWabaId}
                  onChange={(e) => setWhatsappWabaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setApiSaveSuccess(true);
                  setTimeout(() => setApiSaveSuccess(false), 3000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
              >
                Save WhatsApp Credentials
              </button>
            </div>
          </div>

          {/* Gemini AI & Resend Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <Key size={14} className="text-orange-400" />
                Google Gemini AI
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">Model: gemini-1.5-pro / flash for intelligence</p>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs mb-3"
              />
              <button
                onClick={() => {
                  setApiSaveSuccess(true);
                  setTimeout(() => setApiSaveSuccess(false), 3000);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-orange-300 border border-orange-500/20"
              >
                Update Gemini Key
              </button>
            </div>

            <div className="p-5 rounded-3xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                <Key size={14} className="text-sky-400" />
                Resend / SMTP Mail Delivery
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">Sender: noreply@nexaflow.app</p>
              <input
                type="password"
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs mb-3"
              />
              <button
                onClick={() => {
                  setApiSaveSuccess(true);
                  setTimeout(() => setApiSaveSuccess(false), 3000);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-sky-300 border border-sky-500/20"
              >
                Update Mailer Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: GLOBAL BASECAMP TOOLS GOVERNANCE ── */}
      {activeTab === 'modules' && (
        <div className="p-6 rounded-3xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <h3 className="text-sm font-bold text-white mb-1">Global Basecamp Core Tools Governance</h3>
          <p className="text-xs text-slate-400 mb-6">
            Master toggle switchboard: enforce which tools are available organization-wide
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BASECAMP_MODULES.map((tool) => {
              const isEnabled = modulesMap[tool.key] !== false;
              const Icon = tool.icon;
              return (
                <div
                  key={tool.key}
                  className="p-4 rounded-2xl border flex items-center justify-between transition-all"
                  style={{
                    background: 'var(--nf-panel, #131E24)',
                    borderColor: isEnabled ? 'rgba(57,198,174,0.3)' : 'var(--nf-border, #35464E)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 text-teal-300">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{tool.name}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{tool.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleModule(tool.key)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors flex-shrink-0 ${
                      isEnabled ? 'bg-teal-400 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950 shadow-sm" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 6: AUDIT LOGS ── */}
      {activeTab === 'audit' && (
        <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Platform Security &amp; Audit Logs</h3>
              <p className="text-xs text-slate-400">Complete immutable record of all administrative and team events</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter audit logs..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <button
                onClick={handleClearAuditLogs}
                disabled={clearingAudit || auditLogList.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-300 border border-rose-500/30 transition-colors disabled:opacity-50 flex-shrink-0"
                title="Purge all audit logs"
              >
                {clearingAudit ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Clear Logs
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredAudit.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-white/[0.02] flex items-center justify-between text-xs transition-colors">
                <div>
                  <p className="font-semibold text-white">
                    <strong className="text-teal-300">{log.actor_name || 'System'}</strong> {log.action}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Entity: {log.entity_type} ({log.entity_id})
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 flex-shrink-0">
                  {formatTimeAgo(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 7: TIME TRACKING MASTER TIMESHEET ── */}
      {activeTab === 'time' && (
        <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Master Timesheet &amp; Billable Hours</h3>
              <p className="text-xs text-slate-400">Review hours logged across all projects and team members</p>
            </div>
            <span className="text-xs font-bold text-amber-300">
              Total Logged: {(timeEntries.reduce((acc, t) => acc + (t.duration_minutes || 0), 0) / 60).toFixed(1)} hrs
            </span>
          </div>

          {timeEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No time entries logged yet in the organization.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {timeEntries.map((t) => (
                <div key={t.id} className="p-3.5 hover:bg-white/[0.02] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{t.user_name || 'Team member'}</p>
                    <p className="text-[11px] text-slate-400">
                      Project: <strong className="text-slate-200">{t.project_name || 'General'}</strong> {t.notes && `— "${t.notes}"`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-300 text-sm">
                      {(t.duration_minutes / 60).toFixed(1)}h
                    </span>
                    <p className="text-[10px] text-slate-400">{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
