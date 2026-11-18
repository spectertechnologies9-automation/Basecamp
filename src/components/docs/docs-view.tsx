'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Plus, X, Check, Loader2 } from 'lucide-react';

export function DocsView({ project, initialDocs }: any) {
  const [docs, setDocs] = useState<any[]>(initialDocs || []);
  const [composing, setComposing] = useState(false);
  const [activeDoc, setActiveDoc] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const saveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/docs`, {
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
          setDocs((prev) => [json.data, ...prev]);
          setTitle('');
          setBody('');
          setComposing(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <div className="flex items-center gap-3">
          <Link href={`/projects/${project.id}`} className="hover:opacity-70" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            <ArrowLeft size={16} />
          </Link>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,198,174,0.15)', color: 'var(--nf-accent, #39C6AE)' }}>
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Docs &amp; Files · {project.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Specifications, guides, checklists, and project reference material
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveDoc(null);
            setComposing(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          <Plus size={14} /> New Document
        </button>
      </div>

      {composing ? (
        <form onSubmit={saveDoc} className="rounded-2xl border p-6 mb-8" style={{ background: 'var(--nf-panel, #131E24)', borderColor: 'var(--nf-accent, #39C6AE)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>Create Document</h2>
            <button type="button" onClick={() => setComposing(false)} className="p-1 rounded-lg hover:bg-white/10" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="Document title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-base font-bold outline-none mb-4 pb-2 border-b bg-transparent"
            style={{ color: 'var(--nf-text, #F2F6F8)', borderColor: 'var(--nf-border, #35464E)' }}
          />
          <textarea
            rows={12}
            placeholder="Write your document content (Markdown or plain text supported)…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full text-xs font-mono outline-none resize-none bg-transparent"
            style={{ color: 'var(--nf-text, #F2F6F8)' }}
          />
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
            <button type="button" onClick={() => setComposing(false)} className="px-4 py-2 rounded-lg text-xs font-medium" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
              style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Save Document
            </button>
          </div>
        </form>
      ) : activeDoc ? (
        <div className="rounded-2xl border p-6" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>{activeDoc.title}</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                By {activeDoc.author_name || 'Team Member'} · Updated {new Date(activeDoc.updated_at || activeDoc.created_at).toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => setActiveDoc(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text, #F2F6F8)' }}>
              Back to Docs
            </button>
          </div>
          <div className="text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-[60vh] overflow-y-auto" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            {activeDoc.body}
          </div>
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}>
          <FileText size={48} className="mx-auto mb-3 opacity-40" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
          <p className="font-semibold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>No documents written yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Centralize specifications, manuals, meeting minutes, and architectural docs here.
          </p>
          <button
            onClick={() => setComposing(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
          >
            <Plus size={14} /> Write First Doc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setActiveDoc(doc)}
              className="p-5 rounded-2xl border cursor-pointer hover:border-opacity-100 transition-all flex flex-col justify-between group"
              style={{ background: 'var(--nf-card, #1C2A31)', borderColor: 'var(--nf-border, #35464E)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} style={{ color: 'var(--nf-accent, #39C6AE)' }} />
                  <h3 className="text-sm font-bold group-hover:text-emerald-400 transition-colors truncate" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                    {doc.title}
                  </h3>
                </div>
                <p className="text-xs line-clamp-4 leading-relaxed" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                  {doc.body || 'No content.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-[10px]" style={{ borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text-muted, #AAB8C0)' }}>
                <span>{new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</span>
                <span className="font-semibold" style={{ color: 'var(--nf-accent, #39C6AE)' }}>Read →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
