'use client';

import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--nf-text)' }}>
        Something went wrong
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--nf-text-muted)' }}>
        {error.message}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: 'var(--nf-card)', color: 'var(--nf-text)' }}
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
