'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Invalid credentials. Only registered accounts can sign in.');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Unable to connect to authentication service. Please try again.');
    }
  };

  return (
    <div
      className="rounded-xl p-8 border"
      style={{
        background: 'var(--nf-panel, #131E24)',
        borderColor: 'var(--nf-border, #35464E)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
          Welcome back
        </h1>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
        Sign in to your NexaFlow workspace
      </p>

      {error && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-lg mb-4 text-xs border"
          style={{
            background: 'rgba(229,107,112,0.12)',
            borderColor: 'var(--nf-danger, #E56B70)',
            color: 'var(--nf-danger, #E56B70)',
          }}
        >
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm transition-colors outline-none"
              style={{
                background: 'var(--nf-card, #1C2A31)',
                border: `1px solid ${errors.email ? 'var(--nf-danger, #E56B70)' : 'var(--nf-border, #35464E)'}`,
                color: 'var(--nf-text, #F2F6F8)',
              }}
            />
          </div>
          {errors.email && (
            <p className="text-xs mt-1" style={{ color: 'var(--nf-danger, #E56B70)' }}>{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs hover:underline"
              style={{ color: 'var(--nf-accent, #39C6AE)' }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }} />
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm transition-colors outline-none"
              style={{
                background: 'var(--nf-card, #1C2A31)',
                border: `1px solid ${errors.password ? 'var(--nf-danger, #E56B70)' : 'var(--nf-border, #35464E)'}`,
                color: 'var(--nf-text, #F2F6F8)',
              }}
            />
          </div>
          {errors.password && (
            <p className="text-xs mt-1" style={{ color: 'var(--nf-danger, #E56B70)' }}>{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t text-center text-sm" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
        <p style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
          Don&apos;t have an account yet?{' '}
          <Link href="/auth/signup" className="font-semibold hover:underline" style={{ color: 'var(--nf-accent, #39C6AE)' }}>
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );
}
