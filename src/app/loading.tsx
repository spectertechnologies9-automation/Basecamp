'use client';
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--nf-border)', borderTopColor: 'var(--nf-accent)' }} />
        <p className="text-sm" style={{ color: 'var(--nf-text-muted)' }}>Loading…</p>
      </div>
    </div>
  );
}
