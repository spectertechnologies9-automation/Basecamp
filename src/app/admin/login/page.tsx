'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Lock, ArrowLeft, Key, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Access denied. Incorrect administrator security key.');
        return;
      }

      window.location.href = '/admin';
    } catch {
      setError('Unable to authenticate with administration service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--nf-bg, #0B1419)' }}
    >
      <div className="w-full max-w-md">
        {/* Return to workspace */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold mb-6 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
        >
          <ArrowLeft size={14} /> Return to Workspace Dashboard
        </Link>

        <div
          className="rounded-3xl border p-8 shadow-2xl relative overflow-hidden"
          style={{
            background: 'var(--nf-panel, #131E24)',
            borderColor: 'var(--nf-border, #35464E)',
          }}
        >
          {/* Top highlight bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background: 'linear-gradient(90deg, #E56B70, #E9AC57, #39C6AE)',
            }}
          />

          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(229,107,112,0.15)',
                color: '#E56B70',
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
                Administration Terminal
              </h1>
              <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                Elevated Privileges &amp; Workspace Architecture
              </p>
            </div>
          </div>

          <div
            className="p-3.5 rounded-xl border mb-6 text-xs leading-relaxed"
            style={{
              background: 'var(--nf-card, #1C2A31)',
              borderColor: 'var(--nf-border, #35464E)',
              color: 'var(--nf-text-muted, #AAB8C0)',
            }}
          >
            <p>
              Administrative functions are isolated from daily workspace navigation. Enter the master administration security key or your Owner account password to unlock.
            </p>
          </div>

          {error && (
            <div
              className="p-3.5 rounded-xl border mb-5 text-xs flex items-center gap-2"
              style={{
                background: 'rgba(229,107,112,0.15)',
                borderColor: '#E56B70',
                color: '#E56B70',
              }}
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--nf-text, #F2F6F8)' }}
              >
                Security Key / Master Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
                />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none font-mono tracking-wider transition-colors"
                  style={{
                    background: 'var(--nf-card, #1C2A31)',
                    border: '1px solid var(--nf-border, #35464E)',
                    color: 'var(--nf-text, #F2F6F8)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 shadow-lg"
              style={{
                background: '#E56B70',
                color: '#FFFFFF',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              Authenticate Administrator
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
