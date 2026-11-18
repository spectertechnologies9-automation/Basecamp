'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Zap,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  trigger_type: string;
  subject: string;
  template_body: string;
  target_audience: string;
  is_active: number | boolean;
  last_triggered_at?: string;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  status: string;
  created_at: string;
}

export function MailAutomationView() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [providerConfig, setProviderConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'triggers' | 'broadcast' | 'logs'>('triggers');

  // Broadcast composer form state
  const [recipient, setRecipient] = useState('all_team');
  const [customEmail, setCustomEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/automations/mail');
      const json = await res.json();
      if (json.data) {
        setAutomations(json.data.automations || []);
        setLogs(json.data.logs || []);
        if (json.data.providerConfig) {
          setProviderConfig(json.data.providerConfig);
        }
      }
    } catch {
      console.error('Failed to load email automations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const toggleAutomation = async (id: string, currentState: number | boolean) => {
    const nextState = !currentState;
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: nextState ? 1 : 0 } : a))
    );

    try {
      await fetch('/api/automations/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          id,
          is_active: nextState,
        }),
      });
    } catch {
      // Revert on error
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: currentState ? 1 : 0 } : a))
      );
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !bodyText.trim()) return;

    setSending(true);
    setStatusMsg(null);

    const emailTarget = recipient === 'all_team' ? 'team@specteros.local' : customEmail.trim() || 'team@specteros.local';

    try {
      const res = await fetch('/api/automations/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast',
          recipient_email: emailTarget,
          recipient_name: recipient === 'all_team' ? 'Entire Organization Team' : 'Team Member',
          subject: subject.trim(),
          message_body: bodyText.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ text: json.error || 'Failed to dispatch email', error: true });
        return;
      }

      setStatusMsg({ text: `Dispatched successfully to ${emailTarget}!` });
      setSubject('');
      setBodyText('');
      fetchAutomations();
    } catch {
      setStatusMsg({ text: 'Network connection failed', error: true });
    } finally {
      setSending(false);
    }
  };

  const handleSendTestPing = async (automation: Automation) => {
    try {
      const res = await fetch('/api/automations/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          automation_id: automation.id,
          recipient_email: 'jane@specteros.local',
          recipient_name: 'Jane Doe',
          subject: `[TEST] ${automation.subject.replace('{{name}}', 'Jane').replace('{{task_title}}', 'Design System').replace('{{project_name}}', 'Marketing Launch')}`,
          message_body: automation.template_body
            .replace(/\{\{name\}\}/g, 'Jane')
            .replace(/\{\{task_title\}\}/g, 'Design System Review')
            .replace(/\{\{project_name\}\}/g, 'Marketing Launch')
            .replace(/\{\{due_count\}\}/g, '3')
            .replace(/\{\{completed_count\}\}/g, '14')
            .replace(/\{\{discussions_count\}\}/g, '5')
            .replace(/\{\{task_url\}\}/g, 'http://localhost:3000/my-tasks'),
        }),
      });

      if (res.ok) {
        setStatusMsg({ text: `Test simulation delivered for "${automation.name}"!` });
        fetchAutomations();
      }
    } catch {
      setStatusMsg({ text: 'Failed to send test ping', error: true });
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-teal-400 bg-teal-500/10">
            <Mail size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Mail Automation &amp; Notification Engine
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                providerConfig?.isLive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-teal-500/15 text-teal-400'
              }`}>
                {providerConfig?.isLive ? `Live Provider: ${providerConfig.activeProvider.toUpperCase()}` : 'Simulation Engine Active'}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Scheduled briefings, task due-date alarms, check-in pings, and instant team broadcasts
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 border" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
          <button
            onClick={() => setActiveTab('triggers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'triggers'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={13} className="inline mr-1.5" />
            Triggers ({automations.filter((a) => a.is_active).length})
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'broadcast'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send size={13} className="inline mr-1.5" />
            Send Broadcast
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'logs'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={13} className="inline mr-1.5" />
            Delivery Logs ({logs.length})
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 mb-6 rounded-2xl text-xs flex items-center justify-between border ${
            statusMsg.error
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {statusMsg.error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            {statusMsg.text}
          </span>
          <button onClick={() => setStatusMsg(null)} className="text-xs opacity-70 hover:opacity-100 font-bold">
            ×
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-xs">Loading mail automation system...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: AUTOMATED TRIGGERS */}
          {activeTab === 'triggers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automations.map((a) => {
                  const isActive = Boolean(a.is_active);
                  return (
                    <div
                      key={a.id}
                      className="p-5 rounded-2xl border transition-all flex flex-col justify-between"
                      style={{
                        background: 'var(--nf-card, #1C2A31)',
                        borderColor: isActive ? 'rgba(57,198,174,0.3)' : 'var(--nf-border, #35464E)',
                      }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-sm font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                            {a.name}
                          </h3>
                          {/* Toggle switch */}
                          <button
                            type="button"
                            onClick={() => toggleAutomation(a.id, a.is_active)}
                            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                              isActive ? 'bg-teal-400 justify-end' : 'bg-slate-700 justify-start'
                            }`}
                            title={isActive ? 'Disable trigger' : 'Enable trigger'}
                          >
                            <span className="bg-slate-950 w-4 h-4 rounded-full shadow-md" />
                          </button>
                        </div>

                        <p className="text-xs mb-3 font-medium text-teal-300">
                          Subject: {a.subject}
                        </p>

                        <div className="p-3 rounded-xl bg-black/25 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3 mb-3 border border-white/5">
                          {a.template_body}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Users size={12} /> Target: <strong className="text-slate-200 capitalize">{a.target_audience.replace('_', ' ')}</strong>
                        </span>

                        <button
                          onClick={() => handleSendTestPing(a)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-teal-300 border border-teal-500/20 transition-colors flex items-center gap-1"
                        >
                          <Send size={10} /> Test Send
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Service Status Card */}
              <div className="p-4 rounded-2xl border bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={20} className="text-teal-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Local Mail Delivery &amp; Resend Integration</h4>
                    <p className="text-[11px] text-slate-400">
                      All triggers execute safely in-memory and record delivery logs. Connect Resend API in Admin to dispatch to real inboxes.
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchAutomations}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1.5 self-start sm:self-center"
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BROADCAST COMPOSER */}
          {activeTab === 'broadcast' && (
            <div className="p-6 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-teal-400" />
                <h3 className="text-sm font-bold text-white">Compose Team Broadcast</h3>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Send an immediate announcement, milestone notification, or release update to your team via automated email.
              </p>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Audience</label>
                    <select
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-slate-950/60 border border-white/10 text-white"
                    >
                      <option value="all_team">All Team Members (Entire Workspace)</option>
                      <option value="custom">Specific Email Address</option>
                    </select>
                  </div>

                  {recipient === 'custom' && (
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-300">Recipient Email</label>
                      <input
                        type="email"
                        required
                        placeholder="colleague@domain.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs outline-none bg-slate-950/60 border border-white/10 text-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Subject Line</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 🚀 Q4 Product Launch Kickoff & Guidelines"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-950/60 border border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">Message Content</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Write your announcement or instructions for the team..."
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-950/60 border border-white/10 text-white resize-y"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-400 hover:bg-teal-300 text-slate-950 transition-colors flex items-center gap-2"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Dispatch Broadcast Now
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: DELIVERY LOGS */}
          {activeTab === 'logs' && (
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock size={14} className="text-teal-400" />
                  Recent Email Dispatch History
                </h3>
                <span className="text-[11px] text-slate-400">{logs.length} deliveries logged</span>
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No automated emails have been logged yet. Send a test email from the Triggers or Broadcast tab.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3.5 hover:bg-white/[0.02] flex items-center justify-between text-xs transition-colors">
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-white truncate">{log.subject}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          To: {log.recipient_email} {log.recipient_name && `(${log.recipient_name})`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 uppercase tracking-wide">
                          {log.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
