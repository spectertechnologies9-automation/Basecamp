'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) { setError(error.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div
        className="rounded-xl p-8 border text-center"
        style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}
      >
        <CheckCircle size={40} className="mx-auto mb-4" style={{ color: 'var(--nf-accent)' }} />
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--nf-text)' }}>
          Check your email
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--nf-text-muted)' }}>
          We sent a password reset link to your email address. It may take a minute to arrive.
        </p>
        <Link href="/auth/login" className="text-sm font-medium hover:underline" style={{ color: 'var(--nf-accent)' }}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-8 border"
      style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}
    >
      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--nf-text)' }}>
        Reset your password
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--nf-text-muted)' }}>
        Enter your email and we'll send you a reset link.
      </p>

      {error && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm border"
          style={{ background: 'rgba(229,107,112,0.1)', borderColor: 'var(--nf-danger)', color: 'var(--nf-danger)' }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nf-text)' }}>
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nf-text-muted)' }} />
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--nf-card)',
                border: `1px solid ${errors.email ? 'var(--nf-danger)' : 'var(--nf-border)'}`,
                color: 'var(--nf-text)',
              }}
            />
          </div>
          {errors.email && (
            <p className="text-xs mt-1" style={{ color: 'var(--nf-danger)' }}>{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Send reset link
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--nf-text-muted)' }}>
        Remember your password?{' '}
        <Link href="/auth/login" className="font-medium hover:underline" style={{ color: 'var(--nf-accent)' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
