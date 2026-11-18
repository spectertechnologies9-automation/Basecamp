'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Mail } from 'lucide-react';

interface AddClientDialogProps {
  projects?: { id: string; name: string }[];
  onClientAdded?: (client: any) => void;
  trigger?: React.ReactNode;
}

export function AddClientDialog({
  projects = [],
  onClientAdded,
  trigger,
}: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [clientType, setClientType] = useState('project-based');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    try {
      const newClient = {
        id: 'client_' + Date.now(),
        name: name.trim(),
        email: email.trim(),
        clientType,
        projectId: selectedProjectId,
      };

      if (onClientAdded) onClientAdded(newClient);

      setName('');
      setEmail('');
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
            ADD CLIENT
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-gradient-to-b from-zinc-900/95 to-zinc-950/98 border border-white/[0.08] text-zinc-100 p-6 rounded-3xl shadow-2xl backdrop-blur-xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-normal font-display text-white">
            Add New Client
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
              CLIENT NAME
            </label>
            <Input
              id="client-name"
              placeholder="e.g. John from Nike"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="bg-zinc-950/80 border-zinc-800 text-sm font-sans text-zinc-100 h-10 rounded-2xl focus:border-orange-500/70 transition-colors"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
              <Input
                id="client-email"
                type="email"
                placeholder="client@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-950/80 border-zinc-800 text-sm font-sans text-zinc-100 pl-10 h-10 rounded-2xl focus:border-orange-500/70 transition-colors"
              />
            </div>
          </div>

          {/* Assign to Project */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
              ASSIGN TO PROJECT
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-10 rounded-md bg-zinc-950 border border-zinc-800 px-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500/70"
            >
              <option value="" disabled>Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Client Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
              CLIENT TYPE
            </label>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value)}
              className="w-full h-10 rounded-md bg-zinc-950 border border-zinc-800 px-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500/70"
            >
              <option value="project-based">Project-based</option>
              <option value="retainer">Retainer</option>
            </select>
          </div>

          {/* Help notice */}
          <p className="text-[11px] text-zinc-400 font-mono leading-relaxed pt-1">
            An email with a magic link will be sent. The client will land directly in the project chat.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-xs font-mono uppercase text-zinc-400 hover:text-white"
            >
              CANCEL
            </Button>
            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || loading}
              className="h-9 px-4 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-[#ECE8DF] text-zinc-950 hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'SENDING…' : 'ADD & INVITE CLIENT'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
