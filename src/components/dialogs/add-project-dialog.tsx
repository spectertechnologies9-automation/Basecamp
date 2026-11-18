'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Shield } from 'lucide-react';
import { useRolePreview } from '@/hooks/use-role-preview';

interface AddProjectDialogProps {
  onProjectAdded?: (project: any) => void;
  trigger?: React.ReactNode;
}

export function AddProjectDialog({ onProjectAdded, trigger }: AddProjectDialogProps) {
  const { previewRole } = useRolePreview();
  const isAdmin = !previewRole || previewRole === 'admin' || (previewRole as string) === 'owner';

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('Internal');
  const [category, setCategory] = useState<'branding' | 'marketing' | 'general'>('branding');
  const [dueDate, setDueDate] = useState('');
  const [leadId, setLeadId] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetch('/api/team/members')
        .then((r) => r.json())
        .then((res) => {
          if (res.data && Array.isArray(res.data)) {
            setTeamMembers(res.data);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  // If user is not an admin, they cannot create projects
  if (!isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const newProj = {
        id: 'prj_' + Date.now().toString(36),
        name: name.trim(),
        description: description.trim(),
        clientName: clientName.trim(),
        category,
        dueDate: dueDate || '2026-10-31',
        status: 'active',
        progress: 0,
        totalItems: 0,
        completedItems: 0,
      };

      try {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProj.name,
            description: newProj.description,
            client_name: newProj.clientName,
            category: newProj.category,
            end_date: newProj.dueDate,
            lead_id: leadId || undefined,
          }),
        });
      } catch {}

      if (onProjectAdded) onProjectAdded(newProj);

      setName('');
      setDescription('');
      setDueDate('');
      setLeadId('');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="h-8 px-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#ECE8DF] text-zinc-950 hover:bg-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 shadow-sm">
            <Plus size={13} className="stroke-[3] text-zinc-950" />
            NEW PROJECT
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-gradient-to-b from-zinc-900/95 to-zinc-950/98 border border-white/[0.08] text-zinc-100 p-6 rounded-3xl shadow-2xl backdrop-blur-xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-normal font-display text-white">
            Create New Project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Project Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
              PROJECT TYPE
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full h-10 rounded-2xl bg-zinc-950/80 border border-zinc-800 px-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500/70 transition-colors"
            >
              <option value="branding">Branding</option>
              <option value="marketing">Marketing</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
              PROJECT NAME *
            </label>
            <Input
              placeholder="e.g. Brand Launch Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="bg-zinc-950/80 border-zinc-800 text-sm font-sans text-zinc-100 h-10 rounded-2xl focus:border-orange-500/70 transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
              DESCRIPTION
            </label>
            <Input
              placeholder="Brief description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-950/80 border-zinc-800 text-sm font-sans text-zinc-100 h-10 rounded-2xl focus:border-orange-500/70 transition-colors"
            />
          </div>

          {/* Assign Team Lead */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium flex items-center justify-between">
              <span>ASSIGN TEAM LEAD</span>
              <span className="text-[10px] text-orange-400 font-normal">Full Project Access</span>
            </label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full h-10 rounded-2xl bg-zinc-950/80 border border-zinc-800 px-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500/70 transition-colors"
            >
              <option value="">Select Team Lead (Optional)...</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
              DUE DATE
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-zinc-950/80 border-zinc-800 text-sm text-zinc-100 h-10 rounded-2xl focus:border-orange-500/70 font-mono transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-xs font-mono uppercase text-zinc-400 hover:text-white rounded-xl"
            >
              CANCEL
            </Button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="h-9 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#ECE8DF] text-zinc-950 hover:bg-white disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm"
            >
              {loading ? 'CREATING…' : 'CREATE'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
