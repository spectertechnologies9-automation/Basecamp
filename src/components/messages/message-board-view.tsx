'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Pin, Plus, X, Loader2 } from 'lucide-react';
import { formatTimeAgo, getInitials, getAvatarColor } from '@/lib/utils';

export function MessageBoardView({ project, posts: initPosts, currentUserId }: any) {
  const [posts, setPosts] = useState(initPosts || []);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const publish = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setPosts((p: any[]) => [json.data, ...p]);
          setComposing(false);
          setTitle('');
          setBody('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-3 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${project.id}`} className="hover:opacity-70" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            <ArrowLeft size={16} />
          </Link>
          <MessageSquare size={18} style={{ color: '#6C8EBF' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            Message Board · {project.name}
          </h1>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          <Plus size={14} /> New message
        </button>
      </div>

      {composing && (
        <div
          className="rounded-2xl border p-5 mb-6"
          style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-accent, #39C6AE)' }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pitch, announcement, or update title…"
            className="w-full text-base font-bold outline-none mb-3 bg-transparent"
            style={{ color: 'var(--nf-text, #F2F6F8)' }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your detailed announcement, background details, decisions..."
            rows={6}
            className="w-full text-sm outline-none resize-none bg-transparent"
            style={{ color: 'var(--nf-text, #F2F6F8)' }}
          />
          <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
            <button
              onClick={publish}
              disabled={saving || !title.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-60 flex items-center gap-1.5"
              style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Posting…' : 'Post to board'}
            </button>
            <button
              onClick={() => setComposing(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium"
              style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
          <p className="font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>No message posts yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Post project pitches, meeting recaps, status reports, and major decisions.
          </p>
          <button
            onClick={() => setComposing(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            <Plus size={14} /> Write First Message
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p: any) => {
            const authorName = p.author?.full_name ?? 'Team Member';
            const color = getAvatarColor(p.author_id || authorName);

            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl border transition-all"
                style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: color + '33', color }}
                  >
                    {getInitials(authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {p.is_pinned && <Pin size={12} style={{ color: '#E9AC57' }} />}
                      <h3 className="text-sm font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                        {p.title}
                      </h3>
                    </div>
                    {p.body && (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap mb-3" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                        {p.body}
                      </p>
                    )}
                    <div className="text-[10px] flex items-center gap-2" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                      <span>By {authorName}</span>
                      <span>·</span>
                      <span>{formatTimeAgo(p.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
