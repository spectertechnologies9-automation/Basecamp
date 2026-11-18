// src/app/not-found.tsx  — global 404 page
import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--nf-bg)' }}
    >
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6"
          style={{ background: 'var(--nf-card)' }}
        >
          🌀
        </div>
        <h1 className="text-5xl font-black mb-3" style={{ color: 'var(--nf-text)' }}>404</h1>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--nf-text)' }}>
          Page not found
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--nf-text-muted)' }}>
          This page doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
