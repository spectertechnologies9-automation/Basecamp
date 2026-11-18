'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Save, Loader2 } from 'lucide-react';
import type { Organization } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  timezone: z.string(),
  require_invite: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const TIMEZONES = [
  'Asia/Kolkata', 'UTC', 'America/New_York', 'America/Chicago',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
  'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
];

interface SettingsViewProps {
  organization: Organization;
}

export function SettingsView({ organization }: SettingsViewProps) {
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: organization.name,
      timezone: organization.timezone ?? 'Asia/Kolkata',
      require_invite: organization.settings?.require_invite ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="min-h-full p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={22} style={{ color: 'var(--nf-accent)' }} />
        <h1 className="text-xl font-bold" style={{ color: 'var(--nf-text)' }}>Organization Settings</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-6 rounded-xl border" style={{ background: 'var(--nf-card)', borderColor: 'var(--nf-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nf-text)' }}>General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nf-text)' }}>Organization name</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--nf-panel)', border: `1px solid ${errors.name ? 'var(--nf-danger)' : 'var(--nf-border)'}`, color: 'var(--nf-text)' }}
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: 'var(--nf-danger)' }}>{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--nf-text)' }}>Default timezone</label>
              <select
                {...register('timezone')}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--nf-panel)', border: '1px solid var(--nf-border)', color: 'var(--nf-text)' }}
              >
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border" style={{ background: 'var(--nf-card)', borderColor: 'var(--nf-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--nf-text)' }}>Security</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('require_invite')} className="w-4 h-4 rounded" />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--nf-text)' }}>Require invitation to join</p>
              <p className="text-xs" style={{ color: 'var(--nf-text-muted)' }}>New members can only join via email invitation</p>
            </div>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: 'var(--nf-accent)', color: '#0B1419' }}
          >
            {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save changes
          </button>
          {saved && <p className="text-sm" style={{ color: 'var(--nf-accent)' }}>✓ Saved successfully</p>}
        </div>
      </form>
    </div>
  );
}
