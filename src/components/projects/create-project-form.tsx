'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Palette } from 'lucide-react';
import Link from 'next/link';
import { PROJECT_COLORS } from '@/lib/constants';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Max 100 characters'),
  description: z.string().max(500, 'Max 500 characters').optional(),
  color: z.string().default('#39C6AE'),
  status: z.enum(['active', 'on_hold']).default('active'),
  visibility: z.enum(['private', 'organization', 'public']).default('organization'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export function CreateProjectForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState('#39C6AE');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { color: '#39C6AE', status: 'active', visibility: 'organization' },
  });

  const onSubmit = async (data: CreateProjectForm) => {
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, color: selectedColor }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to create project.');
        return;
      }

      if (result.data?.id) {
        router.push(`/projects/${result.data.id}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Network error creating project.');
    }
  };

  const selectColor = (c: string) => {
    setSelectedColor(c);
    setValue('color', c);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}
      >
        <ArrowLeft size={14} />
        Back to Dashboard
      </Link>

      <div
        className="rounded-2xl border p-8"
        style={{
          background: 'var(--nf-panel, #131E24)',
          borderColor: 'var(--nf-border, #35464E)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm"
            style={{ background: selectedColor + '22', color: selectedColor }}
          >
            <Palette size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
              Make a new project
            </h1>
            <p className="text-xs" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Set up a shared space for tasks, campfire chat, and files
            </p>
          </div>
        </div>

        {error && (
          <div
            className="p-3 rounded-lg text-xs mb-4"
            style={{ background: 'rgba(229,107,112,0.15)', color: 'var(--nf-danger, #E56B70)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Project name *
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Mobile App Redesign, Marketing Q3, Platform Migration"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-colors"
              style={{
                background: 'var(--nf-card, #1C2A31)',
                border: `1px solid ${errors.name ? 'var(--nf-danger, #E56B70)' : 'var(--nf-border, #35464E)'}`,
                color: 'var(--nf-text, #F2F6F8)',
              }}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: 'var(--nf-danger, #E56B70)' }}>{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="What is this project about? What are the key goals?"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none resize-none transition-colors"
              style={{
                background: 'var(--nf-card, #1C2A31)',
                border: '1px solid var(--nf-border, #35464E)',
                color: 'var(--nf-text, #F2F6F8)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              Color theme
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => selectColor(c)}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center relative"
                  style={{
                    background: c,
                    boxShadow: selectedColor === c ? `0 0 0 2px var(--nf-bg), 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                Start date
              </label>
              <input
                {...register('start_date')}
                type="date"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: 'var(--nf-card, #1C2A31)',
                  border: '1px solid var(--nf-border, #35464E)',
                  color: 'var(--nf-text, #F2F6F8)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
                Target completion date
              </label>
              <input
                {...register('end_date')}
                type="date"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                style={{
                  background: 'var(--nf-card, #1C2A31)',
                  border: '1px solid var(--nf-border, #35464E)',
                  color: 'var(--nf-text, #F2F6F8)',
                }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--nf-border, #35464E)' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--nf-accent, #39C6AE)', color: '#0B1419' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating project…
                </>
              ) : (
                'Create project'
              )}
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors border"
              style={{ borderColor: 'var(--nf-border, #35464E)', color: 'var(--nf-text-muted, #AAB8C0)' }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
