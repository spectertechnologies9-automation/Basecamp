'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, Clock } from 'lucide-react';

export function TimelineView({ project, todos }: any) {
  // Sort todos by start_date or due_date or created_at
  const sorted = [...(todos || [])].sort((a, b) => {
    const da = a.due_date || a.created_at;
    const db = b.due_date || b.created_at;
    return new Date(da).getTime() - new Date(db).getTime();
  });

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <Link href={`/projects/${project.id}`} className="hover:opacity-70" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
            <Calendar size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Project Timeline · {project.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Chronological schedule of tasks, milestones, and project deadlines
            </p>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <Calendar size={48} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
          <p className="font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>No timeline milestones</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Create tasks with due dates in your To-do list to automatically visualize them on the timeline.
          </p>
          <Link
            href={`/projects/${project.id}/todos`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            Add Task Deadlines
          </Link>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
          {sorted.map((t, index) => {
            const isDone = t.status === 'completed';
            const dateStr = t.due_date ? new Date(t.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible target';

            return (
              <div key={t.id} className="relative">
                {/* Timeline node */}
                <div
                  className="absolute -left-[29px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{
                    background: isDone ? '#52B788' : 'var(--nf-bg, #0B1419)',
                    borderColor: isDone ? '#52B788' : 'var(--nf-accent, #39C6AE)',
                  }}
                />

                <div
                  className="p-5 rounded-2xl border transition-all hover:border-opacity-100"
                  style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: isDone ? 'rgba(82,183,136,0.15)' : 'rgba(57,198,174,0.15)', color: isDone ? '#52B788' : 'var(--nf-accent, #39C6AE)' }}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                      <Clock size={12} /> {dateStr}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    {t.title}
                  </h3>

                  {t.description && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                      {t.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
