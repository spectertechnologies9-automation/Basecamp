'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  AlertCircle,
  CheckSquare,
  Columns3,
  ArrowRight,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileCheck2,
  Flame,
  BarChart2,
  Users,
  FolderKanban,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AddProjectDialog } from '@/components/dialogs/add-project-dialog';
import { useRolePreview } from '@/hooks/use-role-preview';
import { TeamGrowthView } from '@/components/dashboard/team-growth-view';

interface HomepageDashboardViewProps {
  user: any;
  projects: any[];
  pendingApprovals?: any[];
  scheduledTasks?: any[];
  openTodos?: any[];
  pipelineTodos?: any[];
  workloadStats?: any[];
  onNavigateToStudio?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export function HomepageDashboardView({
  user,
  projects: initialProjects,
  pendingApprovals = [],
  scheduledTasks = [],
  openTodos = [],
  pipelineTodos = [],
  workloadStats = [],
  onNavigateToStudio,
  onSelectProject,
}: HomepageDashboardViewProps) {
  const router = useRouter();
  const { previewRole } = useRolePreview();
  const effectiveRole = previewRole || user?.role || 'admin';
  const isClient = effectiveRole === 'client';
  const canCreateProject = effectiveRole === 'admin' || effectiveRole === 'owner';

  const firstName = user?.full_name?.split(' ')[0] || 'Member';
  const [projects, setProjects] = useState<any[]>(initialProjects);

  const isMember = effectiveRole === 'team_member' || effectiveRole === 'member';
  const isLead =
    effectiveRole === 'brand_manager' ||
    effectiveRole === 'lead' ||
    effectiveRole === 'team_lead';
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'owner';

  // Master Operations Workspace Tab: 'pipeline' | 'todos' | 'capacity'
  const [workflowTab, setWorkflowTab] = useState<'pipeline' | 'todos' | 'capacity'>('pipeline');

  // Filter user's personal tasks
  const myTasksList = useMemo(() => {
    const list = openTodos.filter((t: any) => {
      if (t.assignee_id && t.assignee_id === user?.id) return true;
      if (t.assignee_ids) {
        if (Array.isArray(t.assignee_ids)) return t.assignee_ids.includes(user?.id);
        if (typeof t.assignee_ids === 'string') return t.assignee_ids.includes(user?.id);
      }
      return false;
    });
    return list.length > 0 ? list : openTodos.slice(0, 6);
  }, [openTodos, user?.id]);

  // Month navigation for calendar widget
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  // Pipeline items state mapped from database
  const [pipelineItems, setPipelineItems] = useState(() => {
    if (pipelineTodos && pipelineTodos.length > 0) {
      return pipelineTodos.map((t: any) => {
        let col: 'todo' | 'in_progress' | 'in_review' | 'done' = 'todo';
        if (t.status === 'in_progress') col = 'in_progress';
        else if (t.status === 'in_review' || t.status === 'review') col = 'in_review';
        else if (t.status === 'completed' || t.status === 'done') col = 'done';
        return {
          id: t.id,
          title: t.title,
          client: t.client_name || t.project_name || 'PROJECT',
          assignee: t.assignee_name || 'UNASSIGNED',
          date: t.due_date ? t.due_date.slice(5) : undefined,
          column: col,
          projectId: t.project_id,
          requested_status: t.requested_status || null,
        };
      });
    }
    return [];
  });

  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Calendar calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthYearLabel = currentMonthDate.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Group scheduled tasks by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    scheduledTasks.forEach((t) => {
      if (t.due_date) {
        const d = t.due_date.slice(0, 10);
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    });
    return map;
  }, [scheduledTasks]);

  // Tasks for the currently selected day
  const selectedDayTasks = tasksByDate[selectedDateStr] || [];

  const selectedDateHeader = useMemo(() => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
    return selectedDateStr;
  }, [selectedDateStr]);

  const handleAddProject = (newProj: any) => {
    setProjects([newProj, ...projects]);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetCol: 'todo' | 'in_progress' | 'in_review' | 'done'
  ) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const statusValue =
      targetCol === 'done' ? 'completed' : targetCol === 'todo' ? 'open' : targetCol;

    if (!canCreateProject && !isLead) {
      // Member drag: Request stage progression
      setPipelineItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, requested_status: statusValue } : item
        )
      );
      setDraggedId(null);

      try {
        await fetch(`/api/todos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requested_status: statusValue }),
        });
      } catch (err) {
        console.error('Failed to request task progression:', err);
      }
      return;
    }

    // Admin / Team Lead immediate update
    setPipelineItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, column: targetCol, requested_status: null } : item
      )
    );
    setDraggedId(null);

    // Persist to DB
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusValue, requested_status: null }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-16">
      {/* ── 1. Hero Greeting & Executive KPI Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white flex items-center gap-3">
            <span>Hey, {firstName}</span>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border bg-zinc-800/80 text-zinc-300 border-white/[0.08] font-normal tracking-wider">
              {effectiveRole.replace('_', ' ').toUpperCase()}
            </span>
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mt-1">
            {isClient
              ? 'CLIENT PORTAL · MILESTONES, REVIEWS & APPROVALS'
              : 'STUDIO COCKPIT · REAL-TIME OPERATIONS & TEAM METRICS'}
          </p>
        </div>

        {/* Executive KPI Ticker Cards */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] shadow-sm">
            <FolderKanban size={14} className="text-orange-400 shrink-0" />
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-zinc-400 uppercase text-[10px]">Projects:</span>
              <strong className="text-white font-bold">{projects.length}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] shadow-sm">
            <CheckSquare size={14} className="text-emerald-400 shrink-0" />
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-zinc-400 uppercase text-[10px]">
                {isClient ? 'Files:' : 'Tasks:'}
              </span>
              <strong className="text-emerald-400 font-bold">
                {isClient ? pendingApprovals.length : openTodos.length}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] shadow-sm">
            <FileCheck2 size={14} className="text-amber-400 shrink-0" />
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-zinc-400 uppercase text-[10px]">Approvals:</span>
              <strong className="text-amber-400 font-bold">{pendingApprovals.length}</strong>
            </div>
          </div>

          {(canCreateProject || isLead) && workloadStats && workloadStats.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] shadow-sm">
              <Users size={14} className="text-indigo-400 shrink-0" />
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-zinc-400 uppercase text-[10px]">Staff:</span>
                <strong className="text-indigo-300 font-bold">{workloadStats.length}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Assignment Notice for newly registered users */}
      {(user?.role === 'role_not_assigned' || !user?.role) && !previewRole && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={15} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                Role Status: Role Not Assigned
              </p>
              <p className="text-[11px] text-zinc-400 font-mono">
                Your account is ready. Workspace administrators can assign your role & project permissions from Admin Portal.
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
            Pending Role Assignment
          </span>
        </div>
      )}

      {/* ── 2. Unified 2-Column Master Cockpit Grid (Matches User Reference Architecture) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (8 cols on XL, ~66% width): Active Projects & Main Operations ── */}
        <div className="xl:col-span-8 space-y-6">
          {/* Active Projects Shelf */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <FolderKanban size={15} className="text-orange-400" />
                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                  {isClient ? 'MY ACTIVE PROJECTS' : 'ACTIVE PROJECTS'}
                </h2>
              </div>
              <div className="flex items-center gap-2.5">
                {canCreateProject && (
                  <AddProjectDialog
                    onProjectAdded={handleAddProject}
                    trigger={
                      <button
                        type="button"
                        className="text-xs font-mono uppercase text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 font-bold"
                      >
                        <Plus size={12} className="stroke-[2.5]" />
                        New Project
                      </button>
                    }
                  />
                )}
                <Link
                  href="/projects"
                  className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1 transition-colors group"
                >
                  VIEW ALL ({projects.length}){' '}
                  <ArrowRight size={11} className="text-orange-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900/60 border border-white/[0.08] p-6 text-center shadow-lg">
                <p className="text-xs font-semibold text-zinc-300 font-sans">No projects assigned</p>
                <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                  You will see projects once an administrator or team lead assigns you.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.slice(0, 3).map((project) => {
                  const calculatedProgress =
                    project.progress !== undefined
                      ? project.progress
                      : project.totalItems && project.totalItems > 0
                      ? Math.round(((project.completedItems || 0) / project.totalItems) * 100)
                      : 0;

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      onClick={(e) => {
                        if (onSelectProject) {
                          e.preventDefault();
                          onSelectProject(project.id);
                        }
                      }}
                      className="group block rounded-2xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-4 hover:border-orange-500/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/60 transition-all duration-200 shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-semibold truncate">
                          {project.clientName || 'PROJECT'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 font-bold">
                          {calculatedProgress}%
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors truncate font-sans mb-1">
                        {project.name}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5 mt-2">
                        <span>
                          {project.completedItems || 0}/{project.totalItems || 0} tasks
                        </span>
                        <span className="text-[9px] uppercase font-semibold text-emerald-400">
                          Active
                        </span>
                      </div>
                      <Progress value={calculatedProgress} className="h-1 bg-zinc-800" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Master Operations Workspace Deck: Pipeline / To-Dos / Staff Capacity */}
          <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-5 shadow-xl shadow-black/40">
            {/* Tab Bar Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-950/80 border border-white/[0.08] shadow-inner">
                <button
                  type="button"
                  onClick={() => setWorkflowTab('pipeline')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                    workflowTab === 'pipeline'
                      ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Columns3 size={13} className="text-sky-400" />
                  <span>Creative Pipeline ({pipelineItems.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkflowTab('todos')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                    workflowTab === 'todos'
                      ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <CheckSquare size={13} className="text-emerald-400" />
                  <span>Team To-Dos ({openTodos.length})</span>
                </button>

                {(canCreateProject || isLead) && workloadStats && workloadStats.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setWorkflowTab('capacity')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                      workflowTab === 'capacity'
                        ? 'bg-zinc-800 text-white shadow-sm border border-white/[0.08]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Users size={13} className="text-indigo-400" />
                    <span>Staff Capacity ({workloadStats.length})</span>
                  </button>
                )}
              </div>

              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                {workflowTab === 'pipeline'
                  ? 'Drag & drop to update stage'
                  : workflowTab === 'todos'
                  ? `${openTodos.length} items awaiting completion`
                  : 'Relative team workload distribution'}
              </span>
            </div>

            {/* TAB 1: CREATIVE PIPELINE (4 Columns) */}
            {workflowTab === 'pipeline' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(
                  [
                    {
                      key: 'todo',
                      label: 'To Do',
                      color: 'border-white/[0.06]',
                      dotColor: 'bg-zinc-400',
                      badgeColor: 'text-zinc-300 bg-zinc-800/80',
                    },
                    {
                      key: 'in_progress',
                      label: 'In Progress',
                      color: 'border-blue-500/20',
                      dotColor: 'bg-blue-400',
                      badgeColor: 'text-blue-400 bg-blue-500/10',
                    },
                    {
                      key: 'in_review',
                      label: 'In Review',
                      color: 'border-amber-500/20',
                      dotColor: 'bg-amber-400',
                      badgeColor: 'text-amber-400 bg-amber-500/10',
                    },
                    {
                      key: 'done',
                      label: 'Done',
                      color: 'border-emerald-500/20',
                      dotColor: 'bg-emerald-400',
                      badgeColor: 'text-emerald-400 bg-emerald-500/10',
                    },
                  ] as const
                ).map((col) => {
                  const items = pipelineItems.filter((i) => i.column === col.key);
                  return (
                    <div
                      key={col.key}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.key)}
                      className={`rounded-2xl bg-zinc-950/60 border ${col.color} p-3 flex flex-col h-[460px] shadow-sm transition-all`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.04] px-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${col.dotColor}`} />
                          <span className="text-[11px] font-mono uppercase font-bold text-white tracking-wider">
                            {col.label}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border border-white/[0.06] ${col.badgeColor}`}
                        >
                          {items.length}
                        </span>
                      </div>

                      {/* Scrollable Cards Container */}
                      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                        {items.length === 0 ? (
                          <div className="py-20 text-center text-[10px] font-mono text-zinc-600">
                            Drop items here
                          </div>
                        ) : (
                          items.map((item) => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item.id)}
                              className={`p-2.5 rounded-xl bg-zinc-900/90 border border-white/[0.06] hover:border-orange-500/40 hover:bg-zinc-800/90 cursor-grab active:cursor-grabbing transition-all shadow-sm ${
                                draggedId === item.id ? 'opacity-40 scale-95' : ''
                              }`}
                            >
                              <p className="text-xs font-bold text-white font-sans leading-tight line-clamp-2">
                                {item.title}
                              </p>
                              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mt-2">
                                <span className="uppercase text-orange-400/90 truncate max-w-[95px]">
                                  {item.client}
                                </span>
                                <span className="truncate max-w-[85px] text-zinc-500">
                                  {item.assignee}
                                </span>
                              </div>
                              {item.date && (
                                <div className="text-[9px] font-mono text-zinc-500 mt-1">
                                  Due {item.date}
                                </div>
                              )}
                              {item.requested_status && (
                                <div className="mt-1 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-center font-bold">
                                  Pending approval
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: TEAM TO-DOS */}
            {workflowTab === 'todos' && (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {openTodos.length === 0 ? (
                  <div className="py-24 text-center text-xs font-mono text-zinc-500">
                    No active tasks pending! All team work is completed. 🎉
                  </div>
                ) : (
                  openTodos.map((task: any) => (
                    <Link
                      key={task.id}
                      href={`/projects/${task.project_id}?tab=todos`}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-white/[0.06] hover:border-orange-500/40 hover:-translate-y-0.5 transition-all group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <CheckSquare size={13} className="text-emerald-400 shrink-0" />
                          <h4 className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors font-sans truncate">
                            {task.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block truncate">
                          {task.project_name || 'Project'} • Due {task.due_date ? task.due_date.slice(5) : 'Flexible'}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 shrink-0">
                        {task.status || 'open'}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: STAFF CAPACITY & OVERLOAD INDEX */}
            {workflowTab === 'capacity' && (canCreateProject || isLead) && (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {workloadStats.length === 0 ? (
                  <div className="py-24 text-center text-xs font-mono text-zinc-500">
                    No active staff workload records found.
                  </div>
                ) : (
                  workloadStats.map((member: any) => {
                    const isOverloaded = member.relativeOverload >= 75;
                    const isModerate = member.relativeOverload >= 40 && member.relativeOverload < 75;

                    return (
                      <div
                        key={member.userId}
                        className="p-3 rounded-xl bg-zinc-950/70 border border-white/[0.06] hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-[190px]">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 overflow-hidden">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              member.name?.slice(0, 2).toUpperCase() || 'TM'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white font-sans truncate">
                                {member.name}
                              </h4>
                              <span className="text-[8px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded-full border bg-zinc-800 text-zinc-400 border-zinc-700">
                                {member.role?.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[9px] font-mono text-zinc-400 mt-0.5 truncate">
                              {member.activeProjects && member.activeProjects.length > 0
                                ? member.activeProjects.join(', ')
                                : 'No active assignments'}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 max-w-sm space-y-1">
                          <div className="flex items-center justify-between text-[9px] font-mono">
                            <span className="text-zinc-400 flex items-center gap-1">
                              {isOverloaded && <Flame size={11} className="text-rose-400" />}
                              {isOverloaded ? (
                                <strong className="text-rose-400 font-semibold">High Load / Overloaded</strong>
                              ) : isModerate ? (
                                <strong className="text-amber-400 font-semibold">Balanced Capacity</strong>
                              ) : (
                                <strong className="text-emerald-400 font-semibold">Optimal Bandwidth</strong>
                              )}
                            </span>
                            <span
                              className={`font-bold ${
                                isOverloaded
                                  ? 'text-rose-400'
                                  : isModerate
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {member.taskCount} tasks ({member.relativeOverload}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-900 border border-white/[0.06] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isOverloaded
                                  ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                                  : isModerate
                                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              }`}
                              style={{ width: `${Math.max(member.relativeOverload, 4)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (4 cols on XL, ~34% width): Schedule, Approvals & Merit Accelerator ── */}
        <div className="xl:col-span-4 space-y-5">
          {/* 1. Schedule & Calendar Widget */}
          <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-5 shadow-xl shadow-black/40 hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CalendarIcon size={15} className="text-teal-400" />
                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                  SCHEDULE
                </h2>
              </div>
              <Link
                href="/calendar"
                className="text-[10px] font-mono text-zinc-400 hover:text-white uppercase flex items-center gap-1 transition-colors group"
              >
                CALENDAR <ArrowRight size={10} className="text-teal-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Mini Calendar Header */}
            <div className="flex items-center justify-between text-xs font-mono text-zinc-200 font-semibold px-1 mb-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:text-white transition-colors"
                title="Previous month"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-xs font-bold">{monthYearLabel}</span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:text-white transition-colors"
                title="Next month"
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono text-zinc-500 pb-1">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono mb-3">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <span key={`blank-${i}`} className="text-zinc-700 p-1 text-[10px]">
                  ·
                </span>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const isSelected = selectedDateStr === dateStr;
                const hasTasks = Boolean(tasksByDate[dateStr]?.length);

                return (
                  <button
                    type="button"
                    key={dateStr}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`p-1 rounded-md transition-all relative text-xs ${
                      isSelected
                        ? 'border border-orange-500 bg-orange-500/20 text-white font-bold'
                        : hasTasks
                        ? 'border border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                        : 'text-zinc-400 hover:bg-zinc-800/60'
                    }`}
                  >
                    {dayNum}
                    {hasTasks && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-orange-400 mx-auto block mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Agenda Below Calendar */}
            <div className="border-t border-zinc-800/80 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white font-sans">{selectedDateHeader}</h3>
                <span className="text-[10px] font-mono text-zinc-400">
                  {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div className="py-4 text-center text-[11px] text-zinc-500 font-mono">
                  No tasks scheduled for this day
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedDayTasks.map((t: any) => (
                    <Link
                      key={t.id}
                      href={`/projects/${t.project_id}?tab=todos`}
                      className="block p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                    >
                      <h4 className="text-xs font-semibold text-white truncate font-sans">
                        {t.title}
                      </h4>
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 mt-0.5">
                        <span>{t.project_name}</span>
                        <span className="uppercase text-orange-400">{t.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Pending Approvals Queue */}
          <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-5 shadow-xl shadow-black/40 hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-400" />
                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-zinc-300">
                  {isClient ? 'DELIVERABLES FOR APPROVAL' : 'PENDING APPROVALS'}
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">
                {pendingApprovals.length} {pendingApprovals.length === 1 ? 'ITEM' : 'ITEMS'}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {pendingApprovals.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                  All clear! ☕
                </div>
              ) : (
                pendingApprovals.map((app: any) => (
                  <Link
                    key={app.id}
                    href={`/projects/${app.project_id}?tab=${
                      app.is_todo ? 'pipeline' : 'review-approval'
                    }`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-white/[0.06] hover:border-amber-500/40 hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 size={12} className="text-amber-400 shrink-0" />
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors font-sans truncate">
                          {app.title}
                        </h4>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 mt-0.5 block truncate">
                        {app.project_name || 'Project'} •{' '}
                        {app.is_todo
                          ? `Progression: ${app.requested_status?.toUpperCase()}`
                          : `By ${app.submitter_name || 'Member'}`}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 shrink-0">
                      {app.is_todo ? 'Pipeline' : app.stage || 'Review'}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* 3. Craft & Merit Accelerator (Strictly hidden for Client, shown to Admins & Members with tasks) */}
          {!isClient && (
            <div>
              <TeamGrowthView
                user={user}
                effectiveRole={effectiveRole}
                mode="cockpit"
                onNavigateToStudio={onNavigateToStudio}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
