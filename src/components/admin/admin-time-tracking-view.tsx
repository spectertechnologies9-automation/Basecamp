'use client';

import { useState } from 'react';
import { Clock, Plus, Calendar, Check, X, Loader2 } from 'lucide-react';

export function AdminTimeTrackingView({ initialEntries, projects, currentUserId }: any) {
  const [entries, setEntries] = useState<any[]>(initialEntries || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const totalMinutes = entries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          duration_minutes: duration,
          notes,
          date,
        }),
      });

      if (res.ok) {
        const pObj = projects.find((p: any) => p.id === projectId);
        setEntries((prev) => [
          {
            id: `tim_${Date.now()}`,
            project_name: pObj?.name || 'Project',
            duration_minutes: parseInt(duration, 10),
            notes,
            date,
            user_name: 'You',
          },
          ...prev,
        ]);
        setNotes('');
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-cyan-400 bg-cyan-500/10">
            <Clock size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Time Tracking &amp; Timesheets
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Monitor team hours, billable throughput, and project timesheets
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          <Plus size={14} /> Log Time
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Total Hours Logged</p>
          <p className="text-3xl font-black text-cyan-400">{totalHours} hrs</p>
        </div>
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Total Entries</p>
          <p className="text-3xl font-black" style={{ color: 'var(--nf-text, #F2F6F8)' }}>{entries.length}</p>
        </div>
        <div className="p-5 rounded-2xl border" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Projects Tracked</p>
          <p className="text-3xl font-black text-emerald-400">{projects.length}</p>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--nf-border, #35464E)', background: 'var(--nf-panel, #131E24)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text-muted, #AAB8C0)' }}>
          <span>Date</span>
          <span>Member</span>
          <span>Project</span>
          <span>Notes</span>
          <span>Duration</span>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
          {entries.length === 0 ? (
            <div className="text-center py-16 text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              No time entries logged yet. Click &quot;Log Time&quot; to submit a timesheet entry.
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-white/5 transition-colors">
                <span className="w-28 text-[11px]" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>{entry.date}</span>
                <span className="w-32 font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>{entry.user_name || 'Team member'}</span>
                <span className="w-40 truncate text-emerald-400 font-medium">{entry.project_name || 'General Workspace'}</span>
                <span className="flex-1 px-4 truncate" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>{entry.notes || '—'}</span>
                <span className="w-24 text-right font-mono font-bold text-cyan-400">
                  {(entry.duration_minutes / 60).toFixed(1)} hrs
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log Time Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl border shadow-2xl relative" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Log Work Time</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}><X size={16} /></button>
            </div>

            <form onSubmit={handleLogTime} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                >
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Minutes Spent</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Task / Work Notes</label>
                <textarea
                  rows={2}
                  placeholder="What did you work on during this block?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs outline-none resize-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>Cancel</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Submit Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
