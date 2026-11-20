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
import { Plus, Users, UserCheck, Shield, AlertCircle, Check } from 'lucide-react';
import { useRolePreview } from '@/hooks/use-role-preview';

interface AddProjectDialogProps {
  onProjectAdded?: (project: any) => void;
  trigger?: React.ReactNode;
}

interface MemberSelection {
  userId: string;
  projectRole: 'lead' | 'member' | 'client';
  workspaceRole?: string;
}

export function AddProjectDialog({ onProjectAdded, trigger }: AddProjectDialogProps) {
  const { previewRole } = useRolePreview();
  const isAdmin = !previewRole || previewRole === 'super_admin' || previewRole === 'admin' || (previewRole as string) === 'owner';

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('Internal');
  const [category, setCategory] = useState<'branding' | 'marketing' | 'general'>('branding');
  const [dueDate, setDueDate] = useState('');
  const [leadId, setLeadId] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, MemberSelection>>({});
  const [loading, setLoading] = useState(false);

  const loadMembers = async () => {
    let membersList: any[] = [];
    try {
      const res = await fetch('/api/team/members');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          membersList = json.data;
        }
      }
    } catch {}

    // Merge registered users from localStorage
    try {
      const stored = localStorage.getItem('specter_registered_users');
      if (stored) {
        const regList = JSON.parse(stored);
        for (const reg of regList) {
          if (
            reg.role !== 'super_admin' &&
            reg.email !== 'superadmin@specteros.agency' &&
            !membersList.some((m) => m.id === reg.id || m.email?.toLowerCase() === reg.email?.toLowerCase())
          ) {
            membersList.push({
              id: reg.id,
              full_name: reg.full_name || reg.email.split('@')[0],
              email: reg.email,
              role: reg.role || 'role_not_assigned',
            });
          }
        }
      }
    } catch {}

    // Exclude stealth super admin from member lists
    const sanitized = membersList.filter(
      (m) => m.role !== 'super_admin' && m.email !== 'superadmin@specteros.agency'
    );
    setTeamMembers(sanitized);
  };

  useEffect(() => {
    if (open) {
      loadMembers();
    }
  }, [open]);

  // If user is not an admin, they cannot create projects
  if (!isAdmin) {
    return null;
  }

  const toggleMember = (member: any) => {
    setSelectedMembers((prev) => {
      const copy = { ...prev };
      if (copy[member.id]) {
        delete copy[member.id];
      } else {
        const needsRole = member.role === 'role_not_assigned' || !member.role;
        copy[member.id] = {
          userId: member.id,
          projectRole: 'member',
          workspaceRole: needsRole ? 'member' : member.role,
        };
      }
      return copy;
    });
  };

  const updateProjectRole = (userId: string, role: 'lead' | 'member' | 'client') => {
    setSelectedMembers((prev) => {
      if (!prev[userId]) return prev;
      return {
        ...prev,
        [userId]: { ...prev[userId], projectRole: role },
      };
    });
  };

  const updateWorkspaceRole = (userId: string, newWsRole: string) => {
    setSelectedMembers((prev) => {
      if (!prev[userId]) return prev;
      return {
        ...prev,
        [userId]: { ...prev[userId], workspaceRole: newWsRole },
      };
    });
    // Also update teamMembers state locally
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, role: newWsRole } : m))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const createdProjId = 'prj_' + Date.now().toString(36);
      const newProj = {
        id: createdProjId,
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

      let finalId = createdProjId;
      try {
        const res = await fetch('/api/projects', {
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
        if (res.ok) {
          const json = await res.json();
          if (json.data?.id) finalId = json.data.id;
        }
      } catch {}

      // Add all selected members to the project and update their workspace roles if unassigned
      const memberEntries = Object.values(selectedMembers);
      for (const entry of memberEntries) {
        try {
          await fetch(`/api/projects/${finalId}/members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: entry.userId,
              role: entry.projectRole,
              workspace_role: entry.workspaceRole,
            }),
          });
        } catch {}

        // If workspace role was updated, persist in localStorage for registered users
        if (entry.workspaceRole) {
          try {
            const stored = localStorage.getItem('specter_registered_users');
            if (stored) {
              const regList = JSON.parse(stored);
              const updatedList = regList.map((u: any) =>
                u.id === entry.userId ? { ...u, role: entry.workspaceRole } : u
              );
              localStorage.setItem('specter_registered_users', JSON.stringify(updatedList));
            }
          } catch {}
        }
      }

      if (onProjectAdded) onProjectAdded({ ...newProj, id: finalId });

      setName('');
      setDescription('');
      setDueDate('');
      setLeadId('');
      setSelectedMembers({});
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
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto bg-gradient-to-b from-zinc-900/98 to-zinc-950/98 border border-white/[0.08] text-zinc-100 p-6 rounded-3xl shadow-2xl backdrop-blur-xl">
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
              <span>PRIMARY TEAM LEAD</span>
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

          {/* Assign Team Members & Roles (Supports role_not_assigned assignment) */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 block font-semibold flex items-center gap-1.5">
                <Users size={13} className="text-orange-400" />
                ASSIGN TEAM MEMBERS &amp; ROLES
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {Object.keys(selectedMembers).length} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 p-2 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 divide-y divide-zinc-800/40">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center font-mono">
                  No other members registered yet.
                </p>
              ) : (
                teamMembers.map((m) => {
                  const isSelected = Boolean(selectedMembers[m.id]);
                  const selection = selectedMembers[m.id];
                  const hasUnassignedRole = m.role === 'role_not_assigned' || !m.role;

                  return (
                    <div
                      key={m.id}
                      className={`pt-2 first:pt-0 pb-2 flex flex-col gap-2 transition-colors ${
                        isSelected ? 'bg-orange-500/5 -mx-1 px-2 rounded-xl' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(m)}
                            className="rounded border-zinc-700 text-orange-500 focus:ring-0 w-3.5 h-3.5"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                              {m.full_name}
                              {hasUnassignedRole && (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Role Not Assigned
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">{m.email}</p>
                          </div>
                        </label>

                        {isSelected && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">Project:</span>
                            <select
                              value={selection.projectRole}
                              onChange={(e) => updateProjectRole(m.id, e.target.value as any)}
                              className="h-7 rounded-lg bg-zinc-900 border border-zinc-700 px-2 text-[11px] font-mono text-zinc-200 outline-none"
                            >
                              <option value="lead">Team Lead</option>
                              <option value="member">Member</option>
                              <option value="client">Client</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* If member has role_not_assigned, allow assigning their workspace role directly */}
                      {isSelected && hasUnassignedRole && (
                        <div className="flex items-center justify-between gap-2 pl-6 py-1 bg-amber-500/10 rounded-lg px-2 border border-amber-500/20">
                          <span className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                            <AlertCircle size={11} /> Assign Workspace Role:
                          </span>
                          <select
                            value={selection.workspaceRole || 'member'}
                            onChange={(e) => updateWorkspaceRole(m.id, e.target.value)}
                            className="h-6 rounded bg-zinc-900 border border-amber-500/40 px-2 text-[10px] font-mono text-amber-200 outline-none font-semibold"
                          >
                            <option value="member">Team Member</option>
                            <option value="project_manager">Team Lead</option>
                            <option value="client">Client</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
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
