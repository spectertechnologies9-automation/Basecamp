'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Plus, MoreHorizontal, CheckCircle2, Clock, AlertCircle, ArrowRight, ArrowLeft as ArrowLeftIcon, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  created_at: string;
}

interface CardTableViewProps {
  project: { id: string; name: string; color?: string };
  initialCards: KanbanCard[];
  currentUserId: string;
}

const COLUMNS = [
  { id: 'open', title: 'To Do', color: '#AAB8C0' },
  { id: 'in_progress', title: 'In Progress', color: '#39C6AE' },
  { id: 'review', title: 'In Review', color: '#E9AC57' },
  { id: 'completed', title: 'Done', color: '#52B788' },
] as const;

export function CardTableView({ project, initialCards }: CardTableViewProps) {
  const router = useRouter();
  const [cards, setCards] = useState<KanbanCard[]>(initialCards || []);
  const [addingInColumn, setAddingInColumn] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const moveCard = async (cardId: string, nextStatus: KanbanCard['status']) => {
    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, status: nextStatus } : c))
    );

    try {
      await fetch(`/api/todos/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.error(err);
      router.refresh();
    }
  };

  const addCard = async (columnStatus: string) => {
    if (!newTitle.trim()) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          priority: newPriority,
          status: columnStatus,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCards((prev) => [...prev, json.data]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNewTitle('');
      setAddingInColumn(null);
    }
  };

  const deleteCard = async (cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    try {
      await fetch(`/api/todos/${cardId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      urgent: { bg: 'rgba(229,107,112,0.15)', text: '#E56B70' },
      high: { bg: 'rgba(233,172,87,0.15)', text: '#E9AC57' },
      medium: { bg: 'rgba(108,142,191,0.15)', text: '#6C8EBF' },
      low: { bg: 'rgba(170,184,192,0.15)', text: '#AAB8C0' },
    };
    const p = map[priority] || map.medium;
    return (
      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: p.bg, color: p.text }}>
        {priority}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height)-56px)]">
      {/* Top Header */}
      <div className="px-6 py-3.5 border-b flex items-center justify-between flex-shrink-0" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <Link href={`/projects/${project.id}`} className="hover:opacity-70" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
            <LayoutGrid size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Card Table · {project.name}
            </h1>
          </div>
        </div>
        <div className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
          {cards.length} total cards
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 overflow-x-auto p-6 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-w-[900px]">
          {COLUMNS.map((col, idx) => {
            const colCards = cards.filter((c) => c.status === col.id);
            const prevCol = idx > 0 ? COLUMNS[idx - 1] : null;
            const nextCol = idx < COLUMNS.length - 1 ? COLUMNS[idx + 1] : null;

            return (
              <div
                key={col.id}
                className="flex flex-col rounded-2xl border p-4 max-h-full"
                style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                    <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                      {col.title}
                    </h2>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold" style={{ background: 'var(--nf-card, #1C2A31)', color: 'var(--nf-text-muted, #AAB8C0)' }}>
                      {colCards.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAddingInColumn(col.id);
                      setNewTitle('');
                    }}
                    className="p-1 rounded-md hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                    title="Add Card"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add Card Form inline */}
                {addingInColumn === col.id && (
                  <div className="p-3 rounded-xl border mb-3" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-accent, #39C6AE)' }}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Card title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addCard(col.id);
                        if (e.key === 'Escape') setAddingInColumn(null);
                      }}
                      className="w-full text-xs outline-none bg-transparent mb-2"
                      style={{ color: 'var(--nf-text, #F2F6F8)' }}
                    />
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="text-[10px] rounded px-1.5 py-0.5 outline-none bg-black/30"
                        style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setAddingInColumn(null)}
                          className="px-2 py-1 text-[10px] rounded hover:bg-white/10"
                          style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => addCard(col.id)}
                          className="px-2.5 py-1 text-[10px] rounded font-semibold"
                          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {colCards.length === 0 && addingInColumn !== col.id && (
                    <div className="text-center py-10 rounded-xl border-dashed border text-[11px]" style={{ borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text-muted, #AAB8C0)' }}>
                      No cards here
                    </div>
                  )}

                  {colCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-3.5 rounded-xl border group hover:border-opacity-100 transition-all flex flex-col justify-between"
                      style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          {getPriorityBadge(card.priority)}
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                            style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                            title="Delete Card"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                          {card.title}
                        </p>
                        {card.description && (
                          <p className="text-[11px] mt-1 line-clamp-2" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                            {card.description}
                          </p>
                        )}
                      </div>

                      {/* Movement Controls */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
                        <div>
                          {prevCol && (
                            <button
                              onClick={() => moveCard(card.id, prevCol.id as any)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold hover:text-white transition-colors"
                              style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                              title={`Move back to ${prevCol.title}`}
                            >
                              <ArrowLeftIcon size={10} /> {prevCol.title}
                            </button>
                          )}
                        </div>
                        <div>
                          {nextCol && (
                            <button
                              onClick={() => moveCard(card.id, nextCol.id as any)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold hover:text-emerald-400 transition-colors"
                              style={{ color: 'var(--nf-accent, #39C6AE)' }}
                              title={`Advance to ${nextCol.title}`}
                            >
                              {nextCol.title} <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
