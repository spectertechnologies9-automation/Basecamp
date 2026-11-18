'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Lock } from 'lucide-react';

export function JoinProjectForm({
  projectId,
  role,
  invitedEmail = '',
}: {
  projectId: string;
  role: string;
  invitedEmail?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(invitedEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEmailLocked = !!invitedEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          project_id: projectId,
          role,
          invited_email: invitedEmail || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || 'Failed to accept invitation');
        return;
      }

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch {
      setErrorMsg('Network error while processing invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1.5">
          Full Name
        </label>
        <Input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Jordan Miller"
          className="bg-zinc-950 border-zinc-800 text-white text-xs h-10 rounded-xl"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
            Work Email
          </label>
          {isEmailLocked && (
            <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded flex items-center gap-1 font-semibold border border-orange-500/20">
              <Lock size={10} /> Locked to Invite
            </span>
          )}
        </div>
        <Input
          type="email"
          required
          readOnly={isEmailLocked}
          value={email}
          onChange={(e) => !isEmailLocked && setEmail(e.target.value)}
          placeholder="name@agency.com"
          className={`bg-zinc-950 border-zinc-800 text-white text-xs h-10 rounded-xl ${
            isEmailLocked ? 'opacity-80 cursor-not-allowed bg-zinc-900 border-zinc-700/60' : ''
          }`}
        />
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1.5">
          Create Password
        </label>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="bg-zinc-950 border-zinc-800 text-white text-xs h-10 rounded-xl"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-mono uppercase tracking-wider text-xs h-10 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Setting up account...</span>
          </>
        ) : (
          <>
            <span>Join &amp; Open Workspace</span>
            <ArrowRight size={14} />
          </>
        )}
      </Button>
    </form>
  );
}
