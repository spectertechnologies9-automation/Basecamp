'use client';

import { useState } from 'react';
import { Bookmark, Plus, ExternalLink, X, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  entity_type: string;
  created_at: string;
}

interface MyBookmarksViewProps {
  initialBookmarks: BookmarkItem[];
  currentUserId: string;
}

export function MyBookmarksView({ initialBookmarks }: MyBookmarksViewProps) {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(initialBookmarks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [entityType, setEntityType] = useState('project');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          url: url.trim(),
          entity_type: entityType,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setBookmarks((prev) => [json.data, ...prev]);
        setTitle('');
        setUrl('');
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
            <Bookmark size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>My Bookmarks</h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Pinned projects, frequently accessed boards, and quick links
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          <Plus size={16} /> Add Bookmark
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <Bookmark size={48} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
          <p className="text-base font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>No bookmarks pinned yet</p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Bookmark your favorite projects, task lists, and tools for single-click access.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            <Plus size={16} /> Pin First Bookmark
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bm) => (
            <Link
              key={bm.id}
              href={bm.url}
              className="flex items-center justify-between p-4 rounded-xl border hover:border-opacity-100 transition-all group"
              style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
            >
              <div className="flex items-center gap-3">
                <Bookmark size={18} style={{ color: 'var(--nf-accent, #39C6AE)' }} />
                <div>
                  <h3 className="text-sm font-semibold group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    {bm.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded capitalize" style={{ background: 'var(--nf-panel, #131E24)', color: 'var(--nf-text-muted, #AAB8C0)' }}>
                    {bm.entity_type}
                  </span>
                </div>
              </div>
              <ExternalLink size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl relative"
            style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-border, #35464E)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Add Bookmark
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBookmark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drone Telemetry System"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>URL / Path</label>
                <input
                  type="text"
                  required
                  placeholder="/projects or /calendar"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Category</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--nf-card, #1C2A31)', border: '1px solid var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}
                >
                  <option value="project">Project</option>
                  <option value="todo">Task Board</option>
                  <option value="chat">Campfire Chat</option>
                  <option value="external">External Link</option>
                </select>
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
                  <Check size={16} /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
