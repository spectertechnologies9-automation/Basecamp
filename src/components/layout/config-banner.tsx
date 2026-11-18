'use client';

import { useState } from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

export function ConfigBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="px-4 py-2 text-xs flex items-center justify-between gap-3 border-b"
      style={{
        background: 'rgba(233, 172, 87, 0.15)',
        borderColor: 'rgba(233, 172, 87, 0.3)',
        color: '#F2F6F8',
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <AlertCircle size={14} style={{ color: 'var(--nf-warning, #E9AC57)' }} />
        <span className="font-medium" style={{ color: 'var(--nf-warning, #E9AC57)' }}>
          Supabase is not configured yet (Demo Mode active).
        </span>
        <span style={{ color: 'var(--nf-text-muted)' }}>
          Add your Supabase URL &amp; Key in <code className="px-1 py-0.5 rounded bg-black/30 font-mono text-[11px]">.env.local</code> to enable real user authentication &amp; data persistence.
        </span>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-semibold underline hover:opacity-80 ml-1"
          style={{ color: 'var(--nf-accent, #39C6AE)' }}
        >
          Get Free Keys <ExternalLink size={10} />
        </a>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-white/10 opacity-70 hover:opacity-100 flex-shrink-0"
        title="Dismiss banner"
      >
        <X size={13} />
      </button>
    </div>
  );
}
