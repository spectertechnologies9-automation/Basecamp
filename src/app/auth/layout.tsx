import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--nf-bg)' }}
    >
      <div className="w-full max-w-[420px]">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#39C6AE" />
              <path d="M8 10h6l4 6-4 6H8l4-6-4-6z" fill="white" />
              <path d="M18 10h6l-4 6 4 6h-6l-4-6 4-6z" fill="white" opacity="0.6" />
            </svg>
            <span className="text-2xl font-bold" style={{ color: 'var(--nf-text)' }}>NexaFlow</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--nf-text-muted)' }}>
            Project management &amp; team collaboration
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
