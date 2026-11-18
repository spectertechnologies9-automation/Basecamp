'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Check, Circle, Flag, Calendar, User2, MessageSquare,
  Paperclip, Edit3, Trash2, Clock, AlertTriangle, CheckCircle2,
  Send, Loader2, ChevronDown, ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatTimeAgo, formatRelativeTime, getAvatarColor, getInitials } from '@/lib/utils';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import type { Todo, User, Comment } from '@/types';
import { useRouter } from 'next/navigation';

interface Props {
  todo: Todo & {
    todo_list?: { id: string; name: string };
    subtodos?: Todo[];
    comments?: (Comment & { author: User })[];
  };
  project: { id: string; name: string; color: string };
  members: User[];
  currentUserId: string;
}

export function TodoDetailView({ todo: initialTodo, project, members, currentUserId }: Props) {
  const [todo, setTodo] = useState(initialTodo);
  const [comments, setComments] = useState(initialTodo.comments ?? []);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const router = useRouter();
  const supabase = createClient();

  const isCompleted = todo.status === 'completed';
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !isCompleted;

  const toggleStatus = async () => {
    const newStatus = isCompleted ? 'open' : 'completed';
    await supabase.from('todos').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
      completed_by: newStatus === 'completed' ? currentUserId : null,
    }).eq('id', todo.id);
    setTodo(t => ({ ...t, status: newStatus }));
  };

  const saveTitle = async () => {
    if (!editTitle.trim() || editTitle === todo.title) { setEditing(false); return; }
    await supabase.from('todos').update({ title: editTitle.trim() }).eq('id', todo.id);
    setTodo(t => ({ ...t, title: editTitle.trim() }));
    setEditing(false);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/todos/${todo.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentText.trim() }),
    });
    const { data } = await res.json();
    if (data) {
      setComments(c => [...c, data]);
      setCommentText('');
    }
    setSubmitting(false);
  };

  const deleteTodo = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    await supabase.from('todos').delete().eq('id', todo.id);
    router.push(`/projects/${project.id}/todos`);
  };

  return (
    <div className="min-h-full max-w-4xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-6 text-xs" style={{ color: 'var(--nf-text-muted)' }}>
        <Link href={`/projects/${project.id}`} className="hover:underline" style={{ color: 'var(--nf-text-muted)' }}>{project.name}</Link>
        <span>/</span>
        <Link href={`/projects/${project.id}/todos`} className="hover:underline" style={{ color: 'var(--nf-text-muted)' }}>To-do Lists</Link>
        {todo.todo_list && (
          <>
            <span>/</span>
            <span style={{ color: 'var(--nf-text-muted)' }}>{todo.todo_list.name}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Task header */}
          <div className="rounded-xl border p-5 mb-4" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
            <div className="flex items-start gap-3">
              <button
                onClick={toggleStatus}
                className="flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                style={{
                  borderColor: isCompleted ? 'var(--nf-accent)' : 'var(--nf-border)',
                  background: isCompleted ? 'var(--nf-accent)' : 'transparent',
                }}
              >
                {isCompleted && <Check size={11} style={{ color: '#0B1419' }} />}
              </button>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false); }}
                      className="flex-1 text-lg font-bold outline-none border-b"
                      style={{ background: 'transparent', borderColor: 'var(--nf-accent)', color: 'var(--nf-text)' }}
                    />
                    <button onClick={saveTitle} className="px-3 py-1 rounded-lg text-sm" style={{ background: 'var(--nf-accent)', color: '#0B1419' }}>Save</button>
                    <button onClick={() => setEditing(false)} className="px-3 py-1 rounded-lg text-sm" style={{ color: 'var(--nf-text-muted)' }}>Cancel</button>
                  </div>
                ) : (
                  <h1
                    className={`text-lg font-bold cursor-pointer hover:opacity-80 ${isCompleted ? 'line-through opacity-60' : ''}`}
                    style={{ color: 'var(--nf-text)' }}
                    onClick={() => setEditing(true)}
                  >
                    {todo.title}
                  </h1>
                )}

                {isOverdue && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--nf-danger)' }}>
                    <AlertTriangle size={12} />
                    This task is overdue
                  </div>
                )}
                {isCompleted && todo.completed_at && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--nf-accent)' }}>
                    <CheckCircle2 size={12} />
                    Completed {formatTimeAgo(todo.completed_at)}
                  </div>
                )}
              </div>

              <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--nf-text-muted)' }}>
                <Edit3 size={14} />
              </button>
              <button onClick={deleteTodo} className="p-1.5 rounded hover:bg-white/10 transition-colors" style={{ color: 'var(--nf-danger)' }}>
                <Trash2 size={14} />
              </button>
            </div>

            {/* Description */}
            {todo.description && (
              <div className="mt-4 pl-8">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--nf-text-muted)' }}>{todo.description}</p>
              </div>
            )}
          </div>

          {/* Subtasks */}
          {todo.subtodos && todo.subtodos.length > 0 && (
            <div className="rounded-xl border p-4 mb-4" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--nf-text)' }}>
                Subtasks ({todo.subtodos.filter(s => s.status === 'completed').length}/{todo.subtodos.length})
              </h3>
              <div className="space-y-2">
                {todo.subtodos.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded border flex items-center justify-center"
                      style={{ borderColor: sub.status === 'completed' ? 'var(--nf-accent)' : 'var(--nf-border)', background: sub.status === 'completed' ? 'var(--nf-accent)' : 'transparent' }}
                    >
                      {sub.status === 'completed' && <Check size={9} style={{ color: '#0B1419' }} />}
                    </div>
                    <span className={`text-sm ${sub.status === 'completed' ? 'line-through' : ''}`} style={{ color: sub.status === 'completed' ? 'var(--nf-text-muted)' : 'var(--nf-text)' }}>
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
            <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--nf-border)' }}>
              <MessageSquare size={15} style={{ color: 'var(--nf-text-muted)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--nf-text)' }}>
                Comments ({comments.length})
              </h3>
            </div>

            <div className="p-4">
              {comments.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--nf-text-muted)' }}>No comments yet. Start the conversation!</p>
              ) : (
                <div className="space-y-4 mb-4">
                  {comments.map((c: any) => (
                    <div key={c.id} className="flex gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: getAvatarColor(c.author_id) + '33', color: getAvatarColor(c.author_id) }}
                      >
                        {getInitials(c.author?.full_name ?? 'U')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-sm font-medium" style={{ color: 'var(--nf-text)' }}>{c.author?.full_name}</span>
                          <span className="text-xs" style={{ color: 'var(--nf-text-muted)' }}>{formatTimeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--nf-text)' }}>{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comment input */}
              <div className="flex gap-3 mt-3">
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(); }}
                    placeholder="Leave a comment… (Ctrl+Enter to submit)"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--nf-card)', border: '1px solid var(--nf-border)', color: 'var(--nf-text)' }}
                  />
                </div>
                <button
                  onClick={submitComment}
                  disabled={submitting || !commentText.trim()}
                  className="self-end p-2.5 rounded-xl disabled:opacity-50"
                  style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar meta */}
        <div className="space-y-4">
          <div className="rounded-xl border p-4" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--nf-text-muted)' }}>Details</h3>
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-start gap-2">
                <Circle size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--nf-text-muted)' }} />
                <div>
                  <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--nf-text-muted)' }}>Status</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{
                      background: todo.status === 'completed' ? 'rgba(82,183,136,0.15)' : 'rgba(57,198,174,0.15)',
                      color: todo.status === 'completed' ? '#52B788' : 'var(--nf-accent)',
                    }}
                  >
                    {todo.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-start gap-2">
                <Flag size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--nf-text-muted)' }} />
                <div>
                  <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--nf-text-muted)' }}>Priority</p>
                  <span className="text-xs font-medium" style={{ color: PRIORITY_COLORS[todo.priority] }}>
                    {PRIORITY_LABELS[todo.priority]}
                  </span>
                </div>
              </div>

              {/* Due date */}
              {todo.due_date && (
                <div className="flex items-start gap-2">
                  <Calendar size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--nf-text-muted)' }} />
                  <div>
                    <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--nf-text-muted)' }}>Due date</p>
                    <p className="text-xs" style={{ color: isOverdue ? 'var(--nf-danger)' : 'var(--nf-text)' }}>
                      {formatRelativeTime(todo.due_date)}
                    </p>
                  </div>
                </div>
              )}

              {/* Assignees */}
              <div className="flex items-start gap-2">
                <User2 size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--nf-text-muted)' }} />
                <div>
                  <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--nf-text-muted)' }}>Assignees</p>
                  {todo.assignee_ids?.length > 0 ? (
                    <div className="space-y-1.5">
                      {todo.assignee_ids.map(uid => {
                        const m = members.find(m => m.id === uid);
                        return m ? (
                          <div key={uid} className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: getAvatarColor(uid) + '33', color: getAvatarColor(uid) }}>
                              {getInitials(m.full_name)}
                            </div>
                            <span className="text-xs" style={{ color: 'var(--nf-text)' }}>{m.full_name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--nf-text-muted)' }}>Unassigned</p>
                  )}
                </div>
              </div>

              {/* Created */}
              <div className="flex items-start gap-2">
                <Clock size={13} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--nf-text-muted)' }} />
                <div>
                  <p className="text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--nf-text-muted)' }}>Created</p>
                  <p className="text-xs" style={{ color: 'var(--nf-text)' }}>{formatTimeAgo(todo.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
