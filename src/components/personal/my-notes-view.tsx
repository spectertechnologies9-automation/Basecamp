'use client';

import { useState } from 'react';
import { NotebookPen, Plus, Trash2, Edit3, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface MyNotesViewProps {
  initialNotes: Note[];
  currentUserId: string;
}

export function MyNotesView({ initialNotes }: MyNotesViewProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Note',
          content: content.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setNotes((prev) => [json.data, ...prev]);
        setTitle('');
        setContent('');
        setIsModalOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 w-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
            <NotebookPen size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>My Notes</h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Private scratchpad for ideas, meeting notes, and snippets
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTitle('');
            setContent('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <NotebookPen size={48} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
          <p className="text-base font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>No notes saved yet</p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Capture ideas, scratch work, or personal reminders anytime.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            <Plus size={16} /> Write First Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="p-4 rounded-xl border cursor-pointer hover:border-opacity-100 transition-all flex flex-col justify-between group"
              style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
            >
              <div>
                <h3 className="text-sm font-semibold mb-2 group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                  {note.title}
                </h3>
                <p className="text-xs line-clamp-4 whitespace-pre-line" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  {note.content}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
                <span className="text-[10px]" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                </span>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--nf-accent, #39C6AE)' }}>
                  Open →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View / Edit Modal */}
      {(isModalOpen || selectedNote) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-lg p-6 rounded-2xl border shadow-2xl relative"
            style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                {selectedNote ? selectedNote.title : 'Write New Note'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedNote(null);
                }}
                className="p-1 rounded-lg hover:bg-white/10"
                style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
              >
                <X size={18} />
              </button>
            </div>

            {selectedNote ? (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-xl text-sm whitespace-pre-wrap max-h-96 overflow-y-auto"
                  style={{ background: 'var(--nf-card, #1C2A31)', color: 'var(--nf-text, #F2F6F8)' }}
                >
                  {selectedNote.content}
                </div>
                <div className="flex justify-between items-center text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  <span>Created {new Date(selectedNote.created_at).toLocaleString()}</span>
                  <button
                    onClick={() => {
                      setSelectedNote(null);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: 'var(--nf-card, #1C2A31)', color: 'var(--nf-text, #F2F6F8)' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flight Telemetry Architecture"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--nf-card, #1C2A31)',
                      border: '1px solid var(--nf-border, #35464E)',
                      color: 'var(--nf-text, #F2F6F8)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    Content
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Write your note, code, or ideas here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none font-mono"
                    style={{
                      background: 'var(--nf-card, #1C2A31)',
                      border: '1px solid var(--nf-border, #35464E)',
                      color: 'var(--nf-text, #F2F6F8)',
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--nf-card, #1C2A31)', color: 'var(--nf-text-muted, #AAB8C0)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                    style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
                  >
                    <Check size={16} /> Save Note
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
