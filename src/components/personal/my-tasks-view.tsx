'use client';

import Link from 'next/link';
import {
  CheckSquare, Calendar, Flag, AlertCircle, CheckCircle2, Circle, Clock,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import type { Todo } from '@/types';

interface Props {
  todos: (Todo & { project?: { id: string; name: string; color: string } })[];
  currentUserId: string;
}

export function MyTasksView({ todos, currentUserId }: Props) {
  const overdue = todos.filter(t => t.due_date && new Date(t.due_date) < new Date());
  const dueToday = todos.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const now = new Date();
    return d >= new Date(now.setHours(0,0,0,0)) && d <= new Date(now.setHours(23,59,59,999)) && new Date(t.due_date) >= new Date();
  });
  const upcoming = todos.filter(t => !overdue.includes(t) && !dueToday.includes(t) && t.due_date);
  const noDue = todos.filter(t => !t.due_date);

  const groups = [
    { label: 'Overdue', items: overdue, danger: true },
    { label: 'Due today', items: dueToday, warning: true },
    { label: 'Upcoming', items: upcoming },
    { label: 'No due date', items: noDue },
  ].filter(g => g.items.length > 0);

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare size={22} style={{ color: 'var(--nf-accent)' }} />
        <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text)' }}>My Tasks</h1>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--nf-card)', color: 'var(--nf-text-muted)' }}>
          {todos.length} open
        </span>
      </div>

      {todos.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: 'var(--nf-accent)' }} />
          <p className="text-base font-semibold" style={{ color: 'var(--nf-text)' }}>All caught up!</p>
          <p className="text-sm mt-1" style={{ color: 'var(--nf-text-muted)' }}>No tasks assigned to you.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label}>
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: group.danger ? 'var(--nf-danger)' : group.warning ? 'var(--nf-warning)' : 'var(--nf-text-muted)' }}
              >
                {group.danger && <AlertCircle size={12} />}
                {group.label}
                <span className="font-normal">({group.items.length})</span>
              </h2>
              <div className="space-y-1.5">
                {group.items.map(todo => (
                  <Link
                    key={todo.id}
                    href={`/projects/${(todo as any).project?.id}/todos/${todo.id}`}
                    className="flex items-start gap-3 p-3 rounded-xl border hover:bg-white/5 transition-colors group"
                    style={{ background: 'var(--nf-card)', borderColor: 'var(--nf-border)' }}
                  >
                    <Circle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--nf-border)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:underline" style={{ color: 'var(--nf-text)' }}>{todo.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {(todo as any).project && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: ((todo as any).project.color ?? '#39C6AE') + '22', color: (todo as any).project.color ?? 'var(--nf-accent)' }}>
                            {(todo as any).project.name}
                          </span>
                        )}
                        {todo.priority !== 'medium' && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: PRIORITY_COLORS[todo.priority] }}>
                            <Flag size={9} />{PRIORITY_LABELS[todo.priority]}
                          </span>
                        )}
                        {todo.due_date && (
                          <span className="text-[10px] flex items-center gap-0.5" style={{ color: group.danger ? 'var(--nf-danger)' : 'var(--nf-text-muted)' }}>
                            <Clock size={9} />{formatRelativeTime(todo.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
