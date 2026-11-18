'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  CheckSquare,
  MessageSquare,
  MessageCircle,
  FolderOpen,
  CalendarDays,
  Sparkles,
  Archive,
  Palette,
  ThumbsUp,
  Clock,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';
import { AddClientDialog } from '@/components/dialogs/add-client-dialog';
import { AddProjectDialog } from '@/components/dialogs/add-project-dialog';
import { Progress } from '@/components/ui/progress';
import { useRolePreview } from '@/hooks/use-role-preview';

export interface ProjectItem {
  id: string;
  name: string;
  clientName: string;
  description: string;
  category: 'branding' | 'marketing' | 'general';
  status: string;
  dueDate: string;
  progress: number;
  totalItems: number;
  completedItems: number;
  isPinned?: boolean;
}

export function ProjectsListView({ initialProjects }: { initialProjects: ProjectItem[] }) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [filterMode, setFilterMode] = useState<'recent' | 'all'>('recent');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const { previewRole } = useRolePreview();
  const effectiveRole = previewRole || 'admin';
  const canCreateProject = effectiveRole === 'admin' || (effectiveRole as string) === 'owner';

  const pinnedCount = projects.filter((p) => p.isPinned).length;

  const handleAddProject = (newP: any) => {
    setProjects([newP, ...projects]);
  };

  const handleAddClient = (client: any) => {
    // If a project was selected, client is mapped
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canCreateProject) {
      alert('Only administrators can delete projects.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete "${projectName}"? This will remove all associated tasks, channels, documents, and files.`)) {
      return;
    }

    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete project');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting project');
    } finally {
      setDeletingId(null);
    }
  };

  const categoryBadge = (cat: string) => {
    if (cat === 'branding') {
      return (
        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
          BRANDING
        </span>
      );
    }
    if (cat === 'marketing') {
      return (
        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          MARKETING
        </span>
      );
    }
    return (
      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
        GENERAL
      </span>
    );
  };

  const formatDueDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'DUE OCT 21';
      return `DUE ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`;
    } catch {
      return 'DUE OCT 21';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-white font-display">Projects</h1>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mt-1.5">
            {projects.length} PROJECTS · {pinnedCount} PINNED
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canCreateProject ? (
            <>
              <AddClientDialog
                projects={projects.map((p) => ({ id: p.id, name: p.name }))}
                onClientAdded={handleAddClient}
              />
              <AddProjectDialog onProjectAdded={handleAddProject} />
            </>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 text-[11px] font-mono text-zinc-400 shadow-sm">
              ROLE: {effectiveRole.toUpperCase()} · CREATION RESTRICTED TO ADMINS &amp; LEADS
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs matching Screenshot 4: 'Recent' / 'All' */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-white/[0.08] w-fit shadow-sm">
        <button
          onClick={() => setFilterMode('recent')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
            filterMode === 'recent'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Clock size={12} className="text-orange-400" />
          Recent
        </button>
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
            filterMode === 'all'
              ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          All
        </button>
      </div>

      {/* Project Cards Grid matching Screenshot 4 */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-amber-400 mb-3 shadow-md">
            <FolderOpen size={22} className="text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1 font-sans">No projects found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4 font-sans">
            No active projects match your workspace. Create a new project to get started with SPECTER OS.
          </p>
          {canCreateProject && (
            <AddProjectDialog onProjectAdded={handleAddProject} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group block rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-6 hover:border-orange-500/40 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 ease-out shadow-lg relative"
            >
              {/* Top row: Client name + Category + Active tag + Delete button (Admin) */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium truncate">
                  {project.clientName}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {categoryBadge(project.category)}
                  <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTIVE
                  </span>
                  {canCreateProject && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                      disabled={deletingId === project.id}
                      title="Delete project permanently (Admin only)"
                      className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-0.5"
                    >
                      <Trash2 size={13} className={deletingId === project.id ? 'animate-spin text-rose-400' : 'text-rose-400/70 hover:text-rose-400'} />
                    </button>
                  )}
                </div>
              </div>

              {/* Project Title */}
              <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 mb-1 font-sans">
                {project.name}
              </h3>

              {/* Description */}
              <p className="text-xs text-zinc-400 line-clamp-2 min-h-[32px] mb-4 font-sans">
                {project.description || '.'}
              </p>

              {/* Items and Progress */}
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
                <span>{project.completedItems}/{project.totalItems} items</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1 bg-zinc-800 mb-4" />

              {/* Bottom row: Tool icons + Due date */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <Megaphone size={12} className="text-sky-400" />
                  <CheckSquare size={12} className="text-emerald-400" />
                  <MessageSquare size={12} className="text-amber-400" />
                  <MessageCircle size={12} className="text-orange-400" />
                  <FolderOpen size={12} className="text-rose-400" />
                  <CalendarDays size={12} className="text-teal-400" />
                  {project.category === 'branding' && (
                    <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded-md border border-zinc-700">
                      +3
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-mono uppercase text-zinc-400 font-medium">
                  {formatDueDate(project.dueDate)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
