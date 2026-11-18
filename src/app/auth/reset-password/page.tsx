'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must have uppercase, lowercase, and a number'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) { setError(error.message); return; }
    setSuccess(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  if (success) {
    return (
      <div className="rounded-xl p-8 border text-center" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
        <CheckCircle size={40} className="mx-auto mb-4" style={{ color: 'var(--nf-accent)' }} />
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--nf-text)' }}>Password updated</h2>
        <p className="text-sm" style={{ color: 'var(--nf-text-muted)' }}>Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-8 border" style={{ background: 'var(--nf-panel)', borderColor: 'var(--nf-border)' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--nf-text)' }}>Set new password</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--nf-text-muted)' }}>Choose a strong password for your account.</p>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm border" style={{ background: 'rgba(229,107,112,0.1)', borderColor: 'var(--nf-danger)', color: 'var(--nf-danger)' }}>
          <AlertCircle size={16} />{error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {(['password', 'confirm'] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nf-text)' }}>
              {field === 'password' ? 'New password' : 'Confirm password'}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--nf-text-muted)' }} />
              <input
                {...register(field)}
                type="password"
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--nf-card)', border: `1px solid ${errors[field] ? 'var(--nf-danger)' : 'var(--nf-border)'}`, color: 'var(--nf-text)' }}
              />
            </div>
            {errors[field] && <p className="text-xs mt-1" style={{ color: 'var(--nf-danger)' }}>{errors[field]?.message}</p>}
          </div>
        ))}
        <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: 'var(--nf-accent)', color: '#0B1419' }}>
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Update password
        </button>
      </form>
    </div>
  );
}
