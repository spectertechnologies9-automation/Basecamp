'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ background: '#0B1419', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '420px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h2 style={{ color: '#F2F6F8', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#AAB8C0', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {error.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={reset}
            style={{ background: '#39C6AE', color: '#0B1419', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
