'use client';

import { useState } from 'react';
import { Shield, Clock, Search, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { formatTimeAgo, getInitials, getAvatarColor } from '@/lib/utils';

interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export function AuditLogsView({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [search, setSearch] = useState('');
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase())
  );

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear all audit logs? This action will purge the historical audit trail.')) {
      return;
    }

    setClearing(true);
    try {
      const res = await fetch('/api/admin/audit', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Failed to clear logs');
        return;
      }

      setLogs([
        {
          id: 'aud_cleared',
          actor_name: 'Administrator',
          action: 'cleared audit logs',
          entity_type: 'system',
          entity_id: 'system',
          created_at: new Date().toISOString(),
        },
      ]);
      setMessage('All audit logs cleared successfully.');
      setTimeout(() => setMessage(null), 4000);
    } catch {
      alert('Network request failed');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-amber-400 bg-amber-500/10">
            <Shield size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Security &amp; Audit Trail
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                {logs.length} Events
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Immutable record of security events, administrative changes, and user actions
            </p>
          </div>
        </div>

        <button
          onClick={handleClearLogs}
          disabled={clearing || logs.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-300 border border-rose-500/30 transition-colors self-start sm:self-center disabled:opacity-50"
        >
          {clearing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Clear Audit Logs
        </button>
      </div>

      {message && (
        <div className="p-3 mb-6 rounded-2xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={15} />
          {message}
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter audit logs by actor, action, or target..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none bg-slate-900 border border-white/10 text-white"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nf-border, #35464E)', background: 'var(--nf-panel, #131E24)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
          <span>Action &amp; Target</span>
          <span>Actor / Time</span>
        </div>

        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-400">
              No audit log entries matching your search.
            </div>
          ) : (
            filtered.map((log) => {
              const actor = log.actor_name || log.actor_email || 'System';
              const color = getAvatarColor(log.actor_id || actor);

              return (
                <div key={log.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02] text-xs">
                  <div>
                    <span className="font-semibold text-white">{log.action}</span>
                    <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-teal-300 border border-white/5">
                      {log.entity_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: color + '33', color }}>
                        {getInitials(actor)}
                      </div>
                      <span className="text-slate-300">{actor}</span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatTimeAgo(log.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
