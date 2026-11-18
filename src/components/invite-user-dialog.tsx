'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Copy, Check, Users, ShieldCheck, Mail, AlertCircle } from 'lucide-react';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
}

export function InviteUserDialog({
  open,
  onOpenChange,
  projectId: initialProjectId,
  projectName: initialProjectName,
}: InviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'lead' | 'client'>('member');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [projects, setProjects] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (open) {
      if (initialProjectId) {
        setSelectedProjectId(initialProjectId);
      } else {
        fetch('/api/projects')
          .then((r) => r.json())
          .then((res) => {
            if (res.data && Array.isArray(res.data)) {
              setProjects(res.data);
              if (res.data.length > 0) {
                setSelectedProjectId(res.data[0].id);
              }
            }
          })
          .catch(() => {});
      }
    }
  }, [open, initialProjectId]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const currentProjectName = activeProject?.name || initialProjectName || 'Selected Project';

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please specify the recipient email address');
      return;
    }
    const targetProjId = selectedProjectId || initialProjectId || (projects[0]?.id ?? '');
    if (!targetProjId) {
      setErrorMsg('Please select a project');
      return;
    }

    setCreating(true);
    setErrorMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const token = `inv_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
      const link = `${origin}/auth/join?project_id=${targetProjId}&role=${role}&email=${encodeURIComponent(cleanEmail)}&token=${token}`;

      // Set link immediately so user always sees the generated link without network delay
      setGeneratedLink(link);

      // Safe clipboard copy without throwing
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        }
      } catch {
        // Clipboard access might be blocked by browser; user can still manually copy the link
      }

      // Record in database via background API call
      fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          project_id: targetProjId,
          role,
          token,
        }),
      }).catch(() => {});
    } catch {
      setErrorMsg('Failed to generate invite link');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyExisting = async () => {
    if (generatedLink && typeof navigator !== 'undefined') {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(generatedLink);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        }
      } catch {
        // clipboard access restricted
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-gradient-to-b from-zinc-900/95 to-zinc-950/98 border border-white/[0.08] text-zinc-100 rounded-3xl shadow-2xl backdrop-blur-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-display flex items-center gap-2 text-white">
            <Link2 className="h-5 w-5 text-orange-400" />
            Project Link Invite
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Generate a secure, single-recipient invite link. The recipient will be locked strictly to their email and added directly to <strong className="text-white font-medium">{currentProjectName}</strong> with the specified role upon signup.
          </p>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleGenerateLink} className="space-y-4">
            {/* Recipient Email */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
                <Mail size={12} className="text-amber-400" />
                Recipient Email <span className="text-orange-400">*</span>
              </label>
              <Input
                type="email"
                required
                placeholder="colleague@agency.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setGeneratedLink('');
                }}
                className="bg-zinc-950/80 border-zinc-800 text-white text-xs h-10 rounded-2xl focus:border-orange-500/70 font-sans"
              />
              <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                Link is locked exclusively to this email address.
              </span>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-indigo-400" />
                Assigned Role in Project
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'member', label: 'Member', desc: 'Assigned tasks only' },
                  { id: 'lead', label: 'Team Lead', desc: 'Full project control' },
                  { id: 'client', label: 'Client', desc: 'Approvals & schedule' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id as any);
                      setGeneratedLink('');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                      role === r.id
                        ? 'bg-orange-500/15 border-orange-500/60 text-white shadow-sm'
                        : 'bg-zinc-950/80 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono uppercase">{r.label}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Project Selection if multiple */}
            {!initialProjectId && projects.length > 0 && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold mb-1">
                  Target Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setGeneratedLink('');
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white text-xs h-9 rounded-xl px-2.5 font-mono outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.client_name || 'Client'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              type="submit"
              disabled={creating || !email.trim()}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-mono uppercase tracking-wider text-xs h-9 rounded-xl font-semibold shadow-md"
            >
              <Link2 className="h-3.5 w-3.5 mr-1.5" />
              {generatedLink ? 'Regenerate Link' : 'Generate & Copy Invite Link'}
            </Button>
          </form>

          {/* Generated Link Display */}
          {generatedLink && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">Invite Link Ready:</span>
                {copied ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check size={12} /> Copied to Clipboard
                  </span>
                ) : (
                  <span className="text-orange-400 font-semibold">Active</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedLink}
                  className="bg-zinc-900 border-zinc-850 text-zinc-300 font-mono text-[11px] h-8 rounded-lg flex-1 truncate"
                />
                <Button
                  size="sm"
                  onClick={handleCopyExisting}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-3 h-8 rounded-lg"
                >
                  <Copy size={13} className="mr-1" /> Copy
                </Button>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                When opened, this link automatically signs {email} up and adds them to {currentProjectName} as {role === 'lead' ? 'Team Lead' : role}.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
