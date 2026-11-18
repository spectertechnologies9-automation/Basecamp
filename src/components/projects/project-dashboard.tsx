'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Megaphone,
  CheckSquare,
  MessageSquare,
  MessageCircle,
  FolderOpen,
  CalendarDays,
  Package,
  Palette,
  Sparkles,
  Archive,
  ThumbsUp,
  Kanban,
  Calendar,
  TrendingUp,
  BarChart3,
  Settings2,
  Users,
  UserPlus,
  X,
  Lock,
  ChevronRight,
  ChevronDown,
  Plus,
  Send,
  Download,
  ExternalLink,
  CheckCircle2,
  Circle,
  Clock,
  Activity,
  FileText,
  Image as ImageIcon,
  Mail,
  MessagesSquare,
  Pin,
  MessageSquareQuote,
  Eye,
  AlertCircle,
  Trash2,
  Upload,
  HardDrive,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { InviteUserDialog } from '@/components/invite-user-dialog';
import { ProjectSettingsView } from './project-settings-view';
import { SpectraBotDialog } from '@/components/ai/spectra-bot-dialog';
import { cn, formatTimeAgo } from '@/lib/utils';
import { useRolePreview } from '@/hooks/use-role-preview';
import type { Project, AuditLog, ProjectMember } from '@/types';

export type ProjectToolId =
  | 'message-board'
  | 'todos'
  | 'pipeline'
  | 'schedule'
  | 'communication-hub'
  | 'assets-hub'
  | 'analytics'
  | 'whatsapp-automation'
  | 'team-chat'
  | 'client-chat'
  | 'review-approval'
  | 'docs-files'
  | 'deliverables'
  | 'asset-library';

interface ToolConfig {
  id: ProjectToolId;
  label: string;
  description: string;
  category: 'universal' | 'branding' | 'marketing';
  icon: any;
  color: string;
  countLabel?: string;
}

export const ALL_PROJECT_TOOLS: ToolConfig[] = [
  // Universal Hubs & Core Tools
  {
    id: 'message-board',
    label: 'Announcements',
    description: 'Post announcements, pitch ideas, and keep discussions on-topic',
    category: 'universal',
    icon: Megaphone,
    color: 'text-sky-400',
    countLabel: 'announcements',
  },
  {
    id: 'todos',
    label: 'To-dos',
    description: "Track tasks, assign work, and see what's getting done",
    category: 'universal',
    icon: CheckSquare,
    color: 'text-emerald-400',
    countLabel: 'todos',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    description: 'Visual workflow of project deliverables through 4 execution stages',
    category: 'universal',
    icon: Kanban,
    color: 'text-indigo-400',
    countLabel: 'stages',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    description: 'Milestones, due dates, and key events for this project',
    category: 'universal',
    icon: CalendarDays,
    color: 'text-teal-400',
    countLabel: 'events',
  },
  {
    id: 'communication-hub',
    label: 'Communications & Reviews',
    description: 'Unified workspace grouping Team Chat, Client Chat, and Design Review & Approval',
    category: 'universal',
    icon: MessagesSquare,
    color: 'text-amber-400',
    countLabel: 'conversations',
  },
  {
    id: 'assets-hub',
    label: 'Files & Deliverables Vault',
    description: 'Unified workspace grouping Docs & Files, Client Deliverables, and Asset Library',
    category: 'universal',
    icon: Package,
    color: 'text-rose-400',
    countLabel: 'vault items',
  },
  {
    id: 'analytics',
    label: 'Analytics & Tracker',
    description: 'Omni-Route AI tracker with interactive charts, graphs, and file intelligence',
    category: 'universal',
    icon: BarChart3,
    color: 'text-cyan-400',
    countLabel: 'reports',
  },
  {
    id: 'whatsapp-automation',
    label: 'WhatsApp Bot',
    description: 'Real-time client alerts, bot notifications, and direct WhatsApp messaging (Admin & Team Lead)',
    category: 'universal',
    icon: MessagesSquare,
    color: 'text-emerald-400',
    countLabel: 'automations',
  },
];

const DEFAULT_BRANDING_TOOLS: ProjectToolId[] = [
  'message-board',
  'todos',
  'pipeline',
  'schedule',
  'communication-hub',
  'assets-hub',
  'analytics',
  'whatsapp-automation',
];

interface ProjectDashboardProps {
  project: Project & { members: ProjectMember[]; category?: string; clientName?: string; dueDate?: string };
  currentUserId: string;
  stats: { openTodos: number; completedTodos: number };
  todos?: any[];
  activity: AuditLog[];
  initialTool?: ProjectToolId | 'settings' | 'team' | null;
}

export function ProjectDashboard({
  project,
  currentUserId,
  stats,
  todos = [],
  activity = [],
  initialTool = null,
}: ProjectDashboardProps) {
  const router = useRouter();
  const { previewRole } = useRolePreview();
  const currentUserMember = project.members?.find((m: any) => m.user_id === currentUserId);
  const baseRole = currentUserMember?.role || 'member';
  const effectiveRole = previewRole || baseRole;
  const isClient = effectiveRole === 'client';
  const isLead =
    (currentUserMember?.role as string) === 'lead' ||
    (currentUserMember?.role as string) === 'team_lead' ||
    (effectiveRole as string) === 'brand_manager' ||
    (effectiveRole as string) === 'lead';
  const isAdmin =
    (effectiveRole as string) === 'admin' ||
    (effectiveRole as string) === 'owner' ||
    (currentUserMember?.role as string) === 'owner';
  const canManage = isAdmin || isLead;

  const totalTodos = (stats?.openTodos || 0) + (stats?.completedTodos || 0);
  const completedTodos = stats?.completedTodos || 0;
  const progressPct = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  const [commSubTab, setCommSubTab] = useState<'team-chat' | 'client-chat' | 'review-approval'>(() => {
    if (initialTool === 'team-chat') return 'team-chat';
    if (initialTool === 'review-approval') return 'review-approval';
    return isClient ? 'client-chat' : 'client-chat';
  });

  const [assetsSubTab, setAssetsSubTab] = useState<'docs-files' | 'deliverables' | 'asset-library'>(() => {
    if (initialTool === 'deliverables') return 'deliverables';
    if (initialTool === 'asset-library') return 'asset-library';
    return isClient ? 'deliverables' : 'docs-files';
  });

  const [activeView, setActiveView] = useState<ProjectToolId | 'settings' | 'team' | null>(() => {
    if (initialTool === 'team-chat' || initialTool === 'client-chat' || initialTool === 'review-approval') {
      return 'communication-hub';
    }
    if (initialTool === 'docs-files' || initialTool === 'deliverables' || initialTool === 'asset-library') {
      return 'assets-hub';
    }
    if (isClient && initialTool && !['message-board', 'communication-hub', 'assets-hub', 'schedule'].includes(initialTool)) {
      return 'message-board';
    }
    return initialTool;
  });

  const handleSelectTool = (toolId: ProjectToolId) => {
    if (toolId === 'team-chat' || toolId === 'client-chat' || toolId === 'review-approval') {
      setCommSubTab(toolId);
      setActiveView('communication-hub');
    } else if (toolId === 'docs-files' || toolId === 'deliverables' || toolId === 'asset-library') {
      setAssetsSubTab(toolId);
      setActiveView('assets-hub');
    } else {
      setActiveView(toolId);
    }
  };

  const [inviteOpen, setInviteOpen] = useState(false);

  // Settings: which tools are enabled
  const [enabledTools, setEnabledTools] = useState<ProjectToolId[]>(() => {
    const s = project.settings as any;
    if (s?.enabledTools && Array.isArray(s.enabledTools)) {
      return s.enabledTools;
    }
    return DEFAULT_BRANDING_TOOLS;
  });

  const visibleTools = useMemo(() => {
    return ALL_PROJECT_TOOLS.filter((tool) => {
      if (isClient) {
        // Client can only see Announcements, Communications & Reviews, Files & Deliverables Vault, and Schedule
        return ['message-board', 'communication-hub', 'assets-hub', 'schedule'].includes(tool.id);
      }
      // WhatsApp Bot is restricted strictly to Admin and Team Lead
      if (tool.id === 'whatsapp-automation' && !canManage) {
        return false;
      }
      return enabledTools.includes(tool.id);
    });
  }, [isClient, canManage, enabledTools]);

  const toggleTool = async (toolId: ProjectToolId) => {
    const nextTools = enabledTools.includes(toolId)
      ? enabledTools.filter((id) => id !== toolId)
      : [...enabledTools, toolId];
    setEnabledTools(nextTools);

    try {
      const s = (project.settings as any) || {};
      await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...s,
            enabledTools: nextTools,
          },
        }),
      });
    } catch (e) {
      console.error('Failed to save tool preferences:', e);
    }
  };

  const clientName = (project as any).clientName || (project as any).client_name || 'ADIDAS';
  const category = (project as any).category || 'BRANDING';
  const dueDateStr = (project as any).dueDate || (project as any).due_date || (project as any).end_date || '2026-03-16';

  const formattedDueDate = useMemo(() => {
    try {
      const d = new Date(dueDateStr);
      if (isNaN(d.getTime())) return 'MAR 16';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    } catch {
      return 'MAR 16';
    }
  }, [dueDateStr]);

  // Preview todos strictly grounded in real tasks — zero fake placeholder tasks
  const previewTodos = useMemo(() => {
    if (todos && todos.length > 0) {
      return todos.slice(0, 4).map((t) => ({
        id: t.id,
        label: t.title,
        sub: t.assignee_name || (t.assignee_id ? 'ASSIGNED' : 'UNASSIGNED'),
        done: t.status === 'completed' || t.status === 'done',
      }));
    }
    return [];
  }, [todos]);

  // Activity events
  const activityEvents = useMemo(() => {
    if (activity && activity.length > 0) {
      return activity;
    }
    return [
      {
        id: 'ev-1',
        actor: { full_name: 'Harikeshav' },
        action: `created the project ${project.name}`,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'ev-2',
        actor: { full_name: 'Sheeshram B' },
        action: 'joined the project team',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ];
  }, [activity]);

  const activeToolConfig = ALL_PROJECT_TOOLS.find((t) => t.id === activeView);

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* ── Header Matching Screenshot 1 ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (activeView ? setActiveView(null) : router.push('/projects'))}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all duration-200 hover:-translate-x-0.5 active:scale-95 group"
        >
          <ArrowLeft className="h-4 w-4 text-orange-400 group-hover:-translate-x-0.5 transition-transform" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-display flex items-center gap-2">
              {project.name}
            </h1>
            <StatusBadge status={project.status || 'active'} />
            <span className="rf-badge bg-sky-500/10 text-sky-400 border-sky-500/20 uppercase tracking-wider text-[11px] font-semibold font-mono rounded-full">
              {category}
            </span>
          </div>

          <p className="rf-label mt-1 text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
            <span>{clientName}</span>
            <span>·</span>
            <span>DUE {formattedDueDate}</span>
            {activeToolConfig && (
              <>
                <span className="text-zinc-600">→</span>
                <span className="text-orange-400 font-semibold">{activeToolConfig.label}</span>
                {activeView === 'communication-hub' && (
                  <span className="text-zinc-400 font-mono text-[11px]">
                    / {commSubTab === 'team-chat' ? 'Team Chat' : commSubTab === 'client-chat' ? 'Client Chat' : 'Review & Approval'}
                  </span>
                )}
                {activeView === 'assets-hub' && (
                  <span className="text-zinc-400 font-mono text-[11px]">
                    / {assetsSubTab === 'docs-files' ? 'Docs & Files' : assetsSubTab === 'deliverables' ? 'Deliverables' : 'Asset Library'}
                  </span>
                )}
              </>
            )}
            {activeView === 'settings' && (
              <>
                <span className="text-zinc-600">→</span>
                <span className="text-orange-400 font-semibold">CONFIGURE TOOLS</span>
              </>
            )}
            {activeView === 'team' && (
              <>
                <span className="text-zinc-600">→</span>
                <span className="text-orange-400 font-semibold">TEAM</span>
              </>
            )}
          </p>
        </div>

        {/* Action icons on right */}
        <div className="flex items-center gap-1">
          {!activeView ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInviteOpen(true)}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                title="Invite people"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveView('team')}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                title="Manage team"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveView('settings')}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                title="Configure tools"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveView(null)}
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Close view"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Active In-Place View or Grid ── */}
      {activeView ? (
        <div className="animate-fade-in">
          {activeView === 'settings' && (
            <div className="space-y-6">
              <ToolSettingsView
                enabledTools={enabledTools}
                onToggle={toggleTool}
              />
              <ProjectSettingsView project={project} canEdit={canManage} />
            </div>
          )}

          {activeView === 'team' && (
            <ProjectSettingsView project={project} canEdit={canManage} />
          )}

          {/* Unified Communication & Reviews Hub */}
          {(activeView === 'communication-hub' || activeView === 'team-chat' || activeView === 'client-chat' || activeView === 'review-approval') && (
            <div className="space-y-6">
              {/* Unified Pill Switcher */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/80 border border-white/[0.08] w-fit shadow-inner">
                {!isClient && (
                  <button
                    onClick={() => setCommSubTab('team-chat')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200',
                      commSubTab === 'team-chat'
                        ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    <MessageSquare size={14} className="text-inherit" />
                    Team Chat (Internal)
                  </button>
                )}
                <button
                  onClick={() => setCommSubTab('client-chat')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200',
                    commSubTab === 'client-chat'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <MessageCircle size={14} className="text-inherit" />
                  Client Chat
                </button>
                <button
                  onClick={() => setCommSubTab('review-approval')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200',
                    commSubTab === 'review-approval'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <ThumbsUp size={14} className="text-inherit" />
                  Review & Approval
                </button>
              </div>

              {commSubTab === 'team-chat' && !isClient && (
                <IntegratedChatView
                  projectId={project.id}
                  mode="team"
                  clientName={clientName}
                  projectMembers={project.members || []}
                />
              )}
              {commSubTab === 'client-chat' && (
                <IntegratedChatView
                  projectId={project.id}
                  mode="client"
                  clientName={clientName}
                  projectMembers={project.members || []}
                />
              )}
              {commSubTab === 'review-approval' && (
                <IntegratedReviewApprovalView
                  projectId={project.id}
                  clientName={clientName}
                  isClient={isClient}
                  canManage={canManage}
                />
              )}
            </div>
          )}

          {/* Unified Files & Deliverables Vault */}
          {(activeView === 'assets-hub' || activeView === 'docs-files' || activeView === 'deliverables' || activeView === 'asset-library') && (
            <div className="space-y-6">
              {/* Unified Pill Switcher */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/80 border border-white/[0.08] w-fit shadow-inner">
                <button
                  onClick={() => setAssetsSubTab('docs-files')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200',
                    assetsSubTab === 'docs-files'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <FolderOpen size={14} className="text-inherit" />
                  Docs & Files
                </button>
                <button
                  onClick={() => setAssetsSubTab('deliverables')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200',
                    assetsSubTab === 'deliverables'
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <Package size={14} className="text-inherit" />
                  Deliverables
                </button>
                {!isClient && (
                  <button
                    onClick={() => setAssetsSubTab('asset-library')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200',
                      assetsSubTab === 'asset-library'
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    <Archive size={14} className="text-inherit" />
                    Asset Library
                  </button>
                )}
              </div>

              {assetsSubTab === 'docs-files' && (
                <IntegratedDocsFilesView projectId={project.id} canManage={canManage} />
              )}
              {assetsSubTab === 'deliverables' && (
                <IntegratedDeliverablesView projectId={project.id} clientName={clientName} />
              )}
              {assetsSubTab === 'asset-library' && !isClient && (
                <IntegratedAssetLibraryView
                  projectId={project.id}
                  clientName={clientName}
                  canManage={canManage}
                />
              )}
            </div>
          )}

          {activeView === 'whatsapp-automation' && canManage && (
            <IntegratedWhatsAppAutomationView
              projectId={project.id}
              projectName={project.name}
              clientName={clientName}
            />
          )}

          {activeView === 'message-board' && (
            <IntegratedAnnouncementsView
              projectId={project.id}
              isClient={isClient}
              canManage={canManage}
            />
          )}

          {activeView === 'todos' && !isClient && (
            <IntegratedTodosView
              projectId={project.id}
              projectMembers={project.members || []}
              canManage={canManage}
              isClient={isClient}
              currentUserId={currentUserId}
              userRole={effectiveRole}
            />
          )}

          {activeView === 'pipeline' && (
            <IntegratedPipelineView
              projectId={project.id}
              clientName={clientName}
              canManage={canManage}
              isClient={isClient}
            />
          )}

          {activeView === 'schedule' && (
            <IntegratedScheduleView
              projectId={project.id}
              dueDate={dueDateStr}
              canManage={canManage}
            />
          )}

          {activeView === 'analytics' && (
            <IntegratedAnalyticsView
              projectId={project.id}
              projectName={project.name}
              clientName={clientName}
            />
          )}
        </div>
      ) : (
        <>
          {/* ── Description & Progress Card Matching Screenshot 1 ── */}
          <div className="rf-card p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
            {project.description && (
              <p className="text-sm text-zinc-400 mb-4">{project.description}</p>
            )}

            {/* Team row */}
            <div className="flex items-center gap-2 mb-4">
              <span className="rf-label text-[10px] text-zinc-500 mr-1 uppercase tracking-wider font-mono">Team:</span>
              <div className="flex -space-x-2">
                <div
                  className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white text-[10px] font-bold border-2 border-zinc-900"
                  title="Harikeshav (Owner)"
                >
                  H
                </div>
                <div
                  className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold border-2 border-zinc-900"
                  title="Sheeshram B (Designer)"
                >
                  S
                </div>
              </div>
              <button
                onClick={() => setActiveView('team')}
                className="text-[10px] text-orange-400 hover:underline ml-1 font-mono"
              >
                Manage
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between mb-2 font-mono text-xs text-zinc-400">
              <span>{completedTodos}/{totalTodos} items</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1 bg-zinc-800" />
          </div>

          {/* ── 3-Column Tool Cards Grid Matching Screenshot 1 ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleTools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelectTool(tool.id)}
                  className="p-5 cursor-pointer group animate-fade-in rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] hover:border-orange-500/40 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 ease-out shadow-lg relative"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Icon & Arrow */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="p-2.5 rounded-2xl bg-zinc-800/50 border border-white/[0.05] shadow-sm group-hover:scale-105 group-hover:bg-zinc-800/80 transition-all duration-300">
                      <Icon className={cn('h-5 w-5', tool.color)} />
                    </div>
                    <ChevronRight className="h-4 w-4 text-orange-400/80 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 mt-1" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-white text-base mb-1 group-hover:text-orange-300 transition-colors font-sans">
                    {tool.label}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3 font-sans">
                    {tool.description}
                  </p>

                  {/* Basecamp Preview inside the Card */}
                  {tool.id === 'todos' && (
                    <div className="space-y-0 border-t border-zinc-800 pt-2 -mx-5 px-5">
                      {previewTodos.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-zinc-800/40 last:border-0">
                          <div className="h-3.5 w-3.5 rounded-sm border border-zinc-700 mt-0.5 shrink-0 flex items-center justify-center">
                            {item.done && <CheckSquare className="h-2.5 w-2.5 text-emerald-400" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-xs truncate', item.done ? 'line-through text-zinc-500' : 'text-zinc-200')}>
                              {item.label}
                            </p>
                            {item.sub && (
                              <p className="text-[10px] text-zinc-500 truncate font-mono uppercase">{item.sub}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {tool.id === 'communication-hub' && (
                    <div className="border-t border-zinc-800/80 pt-2.5 -mx-5 px-5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-300">Team Chat · Client Chat · Review</span>
                        <span className="text-amber-400 font-bold">Connected</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Real-time collaboration & client sign-offs</p>
                    </div>
                  )}

                  {tool.id === 'assets-hub' && (
                    <div className="border-t border-zinc-800/80 pt-2.5 -mx-5 px-5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-300">Docs · Deliverables · Asset Vault</span>
                        <span className="text-rose-400 font-bold">Organized</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Approved client deliverables & shared files</p>
                    </div>
                  )}

                  {tool.id === 'message-board' && (
                    <div className="border-t border-zinc-800 pt-2 -mx-5 px-5">
                      <div className="py-1">
                        <p className="text-xs text-zinc-300 truncate font-medium">Welcome to {project.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">Harikeshav · 0 comments</p>
                      </div>
                    </div>
                  )}

                  {tool.id === 'analytics' && (
                    <div className="border-t border-zinc-800 pt-2 -mx-5 px-5">
                      <div className="py-1">
                        <p className="text-xs text-zinc-300 truncate font-medium">Multi-Model Analytics</p>
                        <p className="text-[10px] text-zinc-500 font-mono">Omni Route · Grok · Qwen · Charts</p>
                      </div>
                    </div>
                  )}

                  {tool.id === 'whatsapp-automation' && (
                    <div className="border-t border-zinc-800 pt-2 -mx-5 px-5">
                      <div className="py-1 flex items-center justify-between">
                        <span className="text-xs text-zinc-300 font-medium">WhatsApp Bot Connected</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono">Real-time alerts active</p>
                    </div>
                  )}

                  {tool.id === 'pipeline' && (
                    <div className="border-t border-zinc-800 pt-2 -mx-5 px-5">
                      <span className="text-[10px] text-zinc-500 font-mono">5 items in pipeline</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Time-based Activity Feed Strictly for Admins ── */}
          {isAdmin && (
            <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] overflow-hidden shadow-xl shadow-black/40">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/40">
                <Activity className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white font-sans">Activity</h2>
                <span className="text-[10px] font-mono text-zinc-400 ml-auto bg-zinc-800 px-2 py-0.5 rounded-full border border-white/[0.05]">
                  {activityEvents.length} events
                </span>
              </div>

              <div className="divide-y divide-zinc-800/60">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-5 py-2 bg-zinc-950/20">
                  Today
                </div>

                {activityEvents.map((ev: any, idx: number) => {
                  const ts = new Date(ev.created_at || Date.now());
                  const timeStr = ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const actorName = ev.actor?.full_name || 'Team member';

                  return (
                    <div key={ev.id || idx} className="flex hover:bg-zinc-800/20 transition-colors">
                      {/* Timestamp column */}
                      <div className="w-28 shrink-0 py-3.5 px-4 text-right border-r border-zinc-800/60 flex flex-col items-end justify-center">
                        <span className="text-[10px] font-mono text-zinc-400">{timeStr}</span>
                        <span className="text-[10px] text-zinc-500 truncate max-w-full font-sans">{actorName}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex items-center gap-3 py-3.5 px-4">
                        <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                          <Activity className="h-3.5 w-3.5 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-200 font-sans">
                            <strong className="text-white font-medium">{actorName}</strong> {ev.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={project.id}
        projectName={project.name}
      />

      {/* Floating spectraBot AI Assistant */}
      <SpectraBotDialog projectId={project.id} />
    </div>
  );
}

// ─── Sub-Component: ToolSettingsView (Screenshot 2) ───
function ToolSettingsView({
  enabledTools,
  onToggle,
}: {
  enabledTools: ProjectToolId[];
  onToggle: (id: ProjectToolId) => void;
}) {
  const categories = [
    { key: 'universal', label: 'Universal Tools', desc: 'Core collaboration tools available for every project' },
    { key: 'branding', label: 'Branding Tools', desc: 'Design, visual guidelines, mood boards, and asset reviews' },
    { key: 'marketing', label: 'Marketing Tools', desc: 'Campaign tracking, content calendars, and analytics' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-white/[0.08] shadow-xl">
        <h3 className="font-bold text-lg text-white mb-1 font-display">Configure Tools</h3>
        <p className="text-sm text-zinc-400 font-sans">
          Turn tools on or off for this project. Changes apply immediately.
        </p>
      </div>

      {categories.map((cat) => {
        const toolsInCat = ALL_PROJECT_TOOLS.filter((t) => t.category === cat.key);
        return (
          <div key={cat.key} className="rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 border border-white/[0.08] shadow-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/40">
              <h4 className="font-semibold text-sm text-white font-sans">{cat.label}</h4>
              <p className="text-xs text-zinc-400 mt-0.5 font-sans">{cat.desc}</p>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {toolsInCat.map((tool) => {
                const Icon = tool.icon;
                const isEnabled = enabledTools.includes(tool.id);

                return (
                  <div key={tool.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-zinc-800/20 transition-colors">
                    <div className="p-2.5 rounded-2xl bg-zinc-800/50 border border-white/[0.05] shrink-0">
                      <Icon className={cn('h-4 w-4', tool.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white font-sans">{tool.label}</span>
                      <p className="text-xs text-zinc-400 mt-0.5 font-sans">{tool.description}</p>
                    </div>

                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => onToggle(tool.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-Component: IntegratedChatView (Persistent SQLite Chat & Member Tagging) ───
function IntegratedChatView({
  projectId,
  mode,
  clientName,
  projectMembers = [],
}: {
  projectId: string;
  mode: 'client' | 'team';
  clientName: string;
  projectMembers?: any[];
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const isClient = mode === 'client';
  const chatType = isClient ? 'client' : 'campfire';

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/chat?type=${chatType}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.messages) {
          setMessages(json.data.messages);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [projectId, chatType]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    const textToSend = input.trim();
    setInput('');
    setShowMemberPicker(false);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: textToSend,
          type: chatType,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMessages((prev) => [...prev, json.data]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleTagMember = (memberName: string) => {
    const mentionTag = `@${memberName.trim()} `;
    setInput((prev) => (prev ? `${prev} ${mentionTag}` : mentionTag));
    setShowMemberPicker(false);
  };

  const renderFormattedBody = (text: string) => {
    if (!text) return '';
    // Split by @mentions (@word or @Word Name)
    const parts = text.split(/(@[A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30 text-xs font-mono"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] flex flex-col h-[600px] overflow-hidden shadow-2xl shadow-black/50">
      {/* Subheader */}
      <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white font-sans flex items-center gap-2">
            {isClient ? <MessageCircle className="h-4 w-4 text-orange-400" /> : <MessageSquare className="h-4 w-4 text-amber-400" />}
            {isClient ? 'Client Chat' : 'Team Chat'}
          </h3>
          <p className="text-[11px] text-zinc-400 font-mono">
            {isClient ? `Direct communication with ${clientName}` : 'Internal team only — clients cannot see this'}
          </p>
        </div>
        {isClient ? (
          <span className="rf-badge bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px] font-mono">
            SHARED WITH CLIENT
          </span>
        ) : (
          <span className="rf-badge bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono flex items-center gap-1">
            <Lock className="h-3 w-3" /> INTERNAL
          </span>
        )}
      </div>

      {/* Message area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col">
        {messages.length === 0 ? (
          <div className="m-auto text-center py-12 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 mx-auto mb-3 flex items-center justify-center text-zinc-400">
              {isClient ? <MessageCircle className="h-6 w-6 text-orange-400" /> : <MessageSquare className="h-6 w-6 text-amber-400" />}
            </div>
            <h4 className="text-base font-semibold text-white mb-1">No messages yet</h4>
            <p className="text-xs text-zinc-400">
              {isClient
                ? `Start a conversation with ${clientName}. Everyone with access will be notified.`
                : 'Share internal notes, quick questions, and updates with your team.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => {
              const authorName = typeof m.author === 'object' ? (m.author?.full_name || 'Team Member') : (m.author || 'Team Member');
              const authorInitial = authorName[0]?.toUpperCase() || 'U';
              const timeDisplay = m.created_at ? (m.created_at.includes('T') ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : m.created_at) : '';

              return (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {authorInitial}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{authorName}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{timeDisplay}</span>
                    </div>
                    <div className="text-sm text-zinc-200 mt-0.5 bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-700/50 inline-block leading-relaxed">
                      {renderFormattedBody(m.body)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Member Mention Dropdown Selector */}
      {showMemberPicker && (
        <div className="p-2 border-t border-zinc-850 bg-zinc-950 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-150">
          <span className="text-[10px] font-mono text-zinc-400 mr-1 flex items-center gap-1">
            <Users size={11} className="text-orange-400" /> Tag Member:
          </span>
          {projectMembers.length === 0 ? (
            <span className="text-[10px] font-mono text-zinc-500">No members to tag</span>
          ) : (
            projectMembers.map((m: any) => {
              const name = m.user?.full_name || m.full_name || m.name || m.email || 'Member';
              return (
                <button
                  key={m.id || m.user_id}
                  type="button"
                  onClick={() => handleTagMember(name)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-orange-500 hover:bg-orange-500/10 transition-colors"
                >
                  @{name}
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center gap-2 relative">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setShowMemberPicker((prev) => !prev)}
          className={`h-10 px-2.5 rounded-xl border font-mono text-xs ${
            showMemberPicker
              ? 'bg-orange-500/15 border-orange-500 text-orange-400'
              : 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
          title="Tag a project member"
        >
          @
        </Button>
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (e.target.value.endsWith('@')) {
              setShowMemberPicker(true);
            }
          }}
          placeholder={isClient ? 'Message client... (Use @ to tag members)' : 'Message team... (Use @ to tag members)'}
          className="flex-1 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-sm h-10 rounded-xl"
        />
        <Button
          type="submit"
          disabled={!input.trim()}
          className="bg-orange-600 hover:bg-orange-500 text-white h-10 px-4 rounded-xl disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

// ─── Sub-Component: IntegratedAnnouncementsView ───
function IntegratedAnnouncementsView({
  projectId,
  isClient,
  canManage = false,
}: {
  projectId: string;
  isClient?: boolean;
  canManage?: boolean;
}) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('General');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/announcements`);
      if (res.ok) {
        const json = await res.json();
        setAnnouncements(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category, is_pinned: isPinned }),
      });
      if (res.ok) {
        setTitle('');
        setBody('');
        setCategory('General');
        setIsPinned(false);
        setIsCreateOpen(false);
        fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAnnouncement = async (ann: any) => {
    setSelectedAnnouncement(ann);
    try {
      const res = await fetch(`/api/projects/${projectId}/announcements/${ann.id}/comments`);
      if (res.ok) {
        const json = await res.json();
        setComments(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedAnnouncement) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/announcements/${selectedAnnouncement.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: newComment.trim() }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        setComments((prev) => [...prev, json.data]);
        setNewComment('');
        fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Announcements</h3>
          <p className="text-xs text-zinc-400">
            Official project broadcasts, pitch ideas, updates, and discussions
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Post Announcement
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500 font-mono">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="py-14 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800">
          <Megaphone className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">No announcements posted yet</p>
          <p className="text-xs text-zinc-500 mt-1">Broadcast project milestones and kickoff notes here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              onClick={() => openAnnouncement(ann)}
              className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {ann.is_pinned === 1 && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      <Pin size={10} /> PINNED
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase font-semibold">
                    {ann.category || 'General'}
                  </span>
                  <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {formatTimeAgo(ann.created_at)}
                </span>
              </div>
              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-3">
                {ann.body}
              </p>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>By {ann.author_name}</span>
                <span className="flex items-center gap-1 text-orange-400">
                  <MessageSquareQuote size={11} /> {ann.comment_count || 0} comments
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Post New Announcement</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Brand Deliverables Approved"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Launch">Launch</option>
                    <option value="Update">Update</option>
                    <option value="Feedback">Feedback</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="pinCheck"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded border-zinc-700 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="pinCheck" className="text-xs text-zinc-300 cursor-pointer select-none">
                    Pin to top
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Body</label>
                <textarea
                  rows={4}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share details, updates, or instructions..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-500 text-white">
                  Post
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase font-semibold">
                  {selectedAnnouncement.category}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{selectedAnnouncement.title}</h3>
                <p className="text-[10px] font-mono text-zinc-500">
                  By {selectedAnnouncement.author_name} · {formatTimeAgo(selectedAnnouncement.created_at)}
                </p>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement.body}
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase text-zinc-400 font-semibold mb-3">
                  Comments ({comments.length})
                </h4>
                {comments.length === 0 ? (
                  <p className="text-xs text-zinc-500 font-mono text-center py-4">No comments yet</p>
                ) : (
                  <div className="space-y-2">
                    {comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/80">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                          <span className="font-semibold text-zinc-300">{c.author_name}</span>
                          <span>{formatTimeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-xs text-zinc-300">{c.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleAddComment} className="mt-4 pt-3 border-t border-zinc-800 flex gap-2">
              <input
                type="text"
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
              />
              <Button type="submit" size="sm" disabled={isSubmittingComment} className="bg-orange-600 hover:bg-orange-500 text-white text-xs">
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedTodosView ───
function IntegratedTodosView({
  projectId,
  projectMembers = [],
  canManage = false,
  isClient = false,
  currentUserId,
  userRole,
}: {
  projectId: string;
  projectMembers?: any[];
  canManage?: boolean;
  isClient?: boolean;
  currentUserId?: string;
  userRole?: string;
}) {
  const [todos, setTodos] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersList, setMembersList] = useState<any[]>(projectMembers || []);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);

  if (isClient) {
    return null;
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          const assignable = json.data.filter((m: any) => m.role !== 'client');
          setMembersList(assignable);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTodos = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/todos`);
      if (res.ok) {
        const json = await res.json();
        let tasksList: any[] = [];
        if (Array.isArray(json.data)) {
          tasksList = json.data.flatMap((item: any) => (item.todos ? item.todos : [item]));
        }
        setTodos(tasksList.filter((t) => t && t.title));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
    fetchMembers();
  }, [projectId]);

  const allMemberIds = membersList
    .map((m: any) => m.user_id || (m.user && m.user.id) || m.id)
    .filter(Boolean);
  const isAllSelected =
    allMemberIds.length > 0 && allMemberIds.every((id) => selectedAssigneeIds.includes(id));

  const handleToggleAllMembers = () => {
    if (isAllSelected) {
      setSelectedAssigneeIds([]);
    } else {
      setSelectedAssigneeIds(allMemberIds);
    }
  };

  let assigneeSummary = 'Assign Members (Dropdown)...';
  if (isAllSelected) {
    assigneeSummary = `⭐ All Members Assigned (${allMemberIds.length})`;
  } else if (selectedAssigneeIds.length === 1) {
    const single = membersList.find(
      (m: any) => (m.user_id || (m.user && m.user.id) || m.id) === selectedAssigneeIds[0]
    );
    assigneeSummary =
      single?.full_name || single?.user?.full_name || single?.name || '1 Member Assigned';
  } else if (selectedAssigneeIds.length > 1) {
    assigneeSummary = `${selectedAssigneeIds.length} Members Assigned`;
  }

  const handleVote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/todos/${id}/vote`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setTodos((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, vote_count: json.vote_count, has_voted: json.has_voted }
              : t
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTodo = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !canManage) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          due_date: dueDate || null,
          assignee_ids: selectedAssigneeIds,
          assignee_id: selectedAssigneeIds[0] || null,
        }),
      });
      if (res.ok) {
        setNewTitle('');
        setDueDate('');
        setSelectedAssigneeIds([]);
        fetchTodos();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-6 sm:p-8 shadow-xl shadow-black/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <CheckSquare size={18} className="text-emerald-400" />
            <h3 className="text-lg font-bold text-white font-serif tracking-tight">Project To-Dos</h3>
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mt-1">
            {canManage
              ? 'Project deliverables and assigned tasks across all members.'
              : 'Showing tasks specifically assigned to your account.'}
          </p>
        </div>
        {!canManage ? (
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 uppercase font-semibold">
            Assigned to You
          </span>
        ) : (
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.06] uppercase font-bold">
            {todos.length} Tasks Total
          </span>
        )}
      </div>

      {canManage ? (
        <form onSubmit={add} className="space-y-4 p-5 rounded-2xl bg-zinc-950/80 border border-white/[0.08] mb-6 shadow-inner">
          <div className="flex gap-2.5">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a new to-do task (Admin / Team Lead only)..."
              className="bg-zinc-900 border-zinc-700 text-white text-xs h-10 rounded-xl flex-1 font-sans focus:border-orange-500"
            />
            <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 rounded-xl font-semibold font-sans shadow-md shadow-orange-500/20 active:scale-95 transition-all">
              <Plus className="h-4 w-4 mr-1 stroke-[2.5]" /> Add Task
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-zinc-850">
            {/* Deadline */}
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Calendar className="h-4 w-4 text-orange-400" />
              <span>Deadline:</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-zinc-200 font-mono outline-none focus:border-orange-500"
              />
            </div>

            {/* Multi-Assignee Dropdown Picker */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1 shrink-0">
                  <Users size={13} className="text-orange-400" /> Assign To:
                </span>

                <button
                  type="button"
                  onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                  className="flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-orange-500 text-xs font-mono text-zinc-200 transition-all shadow-sm min-w-[210px]"
                >
                  <span className="truncate">{assigneeSummary}</span>
                  <ChevronDown
                    size={13}
                    className={cn(
                      'text-zinc-400 shrink-0 transition-transform duration-200',
                      isAssigneeDropdownOpen && 'rotate-180 text-orange-400'
                    )}
                  />
                </button>
              </div>

              {isAssigneeDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-zinc-950 border border-zinc-750 shadow-2xl p-2.5 z-50 backdrop-blur-md">
                  {/* Option: Assign All Members */}
                  <button
                    type="button"
                    onClick={handleToggleAllMembers}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-left bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 font-semibold transition-colors mb-1.5 border border-orange-500/20"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={13} className="text-orange-400" />
                      {isAllSelected ? 'Deselect All Members' : '⭐ Assign to All Members'}
                    </span>
                    <span className="text-[10px] bg-orange-500/20 px-1.5 py-0.5 rounded font-mono">
                      {membersList.length}
                    </span>
                  </button>

                  <div className="h-px bg-zinc-800 my-1.5" />

                  {/* Individual Members List */}
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {membersList.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 p-2 font-mono text-center">
                        No team members loaded for this project
                      </p>
                    ) : (
                      membersList.map((m: any) => {
                        const id = m.user_id || (m.user && m.user.id) || m.id;
                        const name =
                          m.full_name || m.user?.full_name || m.name || m.email || 'Member';
                        const isSelected = selectedAssigneeIds.includes(id);

                        return (
                          <div
                            key={id}
                            onClick={() =>
                              setSelectedAssigneeIds((prev) =>
                                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                              )
                            }
                            className={cn(
                              'flex items-center justify-between p-2 rounded-xl text-xs font-mono cursor-pointer transition-colors select-none',
                              isSelected
                                ? 'bg-orange-500/15 border border-orange-500/30 text-white font-medium'
                                : 'hover:bg-zinc-900 border border-transparent text-zinc-300'
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div
                                className={cn(
                                  'w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold shrink-0',
                                  isSelected
                                    ? 'bg-orange-500 border-orange-500 text-zinc-950'
                                    : 'border-zinc-700 bg-zinc-900'
                                )}
                              >
                                {isSelected && '✓'}
                              </div>
                              <span className="truncate">{name}</span>
                            </div>

                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                              {m.role || 'member'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-zinc-850 px-1">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {selectedAssigneeIds.length} of {membersList.length} assigned
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAssigneeDropdownOpen(false)}
                      className="text-[11px] font-mono text-orange-400 hover:text-orange-300 px-2 py-0.5 rounded"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 mb-6 text-xs font-mono text-zinc-400 flex items-center justify-between">
          <span>Tasks are created and assigned by the Team Lead or Administrator.</span>
          <span className="text-[10px] text-orange-400 uppercase font-semibold">Your Assigned Work</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500 font-mono">Loading tasks...</div>
      ) : todos.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-xs font-mono text-zinc-500">
          {canManage
            ? 'No tasks in this project yet. Use the form above to assign one.'
            : 'You currently have no tasks assigned to you in this project.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {todos.map((t) => {
            const isDone = t.status === 'completed' || t.status === 'done';
            const isDelayed = !isDone && t.due_date && new Date(t.due_date) < new Date();

            return (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/70 border border-white/[0.06] hover:border-orange-500/40 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 gap-4"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Status Indicator */}
                  <div
                    className="h-5 w-5 rounded-lg border border-zinc-700 bg-zinc-900 flex items-center justify-center shrink-0 cursor-not-allowed shadow-inner"
                    title="Task status is progressed through the Creative Pipeline"
                  >
                    {isDone ? (
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-bold font-sans', isDone ? 'line-through text-zinc-500' : 'text-white')}>
                      {t.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-400 mt-1">
                      {t.assignee_name && (
                        <span className="flex items-center gap-1 text-orange-400">
                          <Users size={11} />
                          {t.assignee_name}
                        </span>
                      )}
                      {t.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Due: {t.due_date}
                        </span>
                      )}
                      {/* Delayed Alert - strictly for Admin and Team Lead */}
                      {isDelayed && canManage && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold uppercase tracking-wider text-[9px]">
                          Task Delayed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge, Voting & Deletion */}
                <div className="flex items-center gap-2 shrink-0">
                  {isDone && (
                    <button
                      onClick={(e) => handleVote(e, t.id)}
                      title="Vote on completed deliverable"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-mono transition-colors"
                    >
                      <ThumbsUp size={12} />
                      <span>{t.vote_count || 0}</span>
                    </button>
                  )}
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                    {t.status || 'open'}
                  </span>
                  {canManage && (
                    <button
                      onClick={(e) => handleDeleteTodo(e, t.id)}
                      title="Delete task (Admin / Team Lead only)"
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedPipelineView ───
function IntegratedPipelineView({
  projectId,
  clientName,
  canManage = false,
  isClient = false,
}: {
  projectId: string;
  clientName: string;
  canManage?: boolean;
  isClient?: boolean;
}) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPipelineTasks = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/todos`);
      if (res.ok) {
        const json = await res.json();
        let tasksList: any[] = [];
        if (Array.isArray(json.data)) {
          tasksList = json.data.flatMap((item: any) => (item.todos ? item.todos : [item]));
        }
        setTasks(tasksList.filter((t) => t && t.title));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineTasks();
  }, [projectId]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  // Immediate move (for Admin / Team Lead)
  const handleMoveImmediate = async (id: string, targetCol: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: targetCol, requested_status: null } : t))
    );

    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetCol, requested_status: null }),
      });
      fetchPipelineTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Member request for stage progression
  const handleRequestProgression = async (id: string, requestedCol: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, requested_status: requestedCol } : t))
    );

    try {
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requested_status: requestedCol }),
      });
      fetchPipelineTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    if (canManage) {
      handleMoveImmediate(id, targetCol);
    } else {
      handleRequestProgression(id, targetCol);
    }
  };

  const handleVote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/todos/${id}/vote`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, vote_count: json.vote_count, has_voted: json.has_voted }
              : t
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { id: 'open', label: 'To Do', keyMatch: ['open', 'todo'], color: 'border-white/[0.08]', dotColor: 'bg-zinc-400', badgeColor: 'text-zinc-400 bg-zinc-800/60' },
    { id: 'in_progress', label: 'In Progress', keyMatch: ['in_progress'], color: 'border-blue-500/25', dotColor: 'bg-blue-400', badgeColor: 'text-blue-400 bg-blue-500/10' },
    { id: 'in_review', label: 'In Review', keyMatch: ['in_review', 'review'], color: 'border-amber-500/25', dotColor: 'bg-amber-400', badgeColor: 'text-amber-400 bg-amber-500/10' },
    { id: 'completed', label: 'Done', keyMatch: ['completed', 'done'], color: 'border-emerald-500/25', dotColor: 'bg-emerald-400', badgeColor: 'text-emerald-400 bg-emerald-500/10' },
  ];

  return (
    <div className="rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-white/[0.08] p-6 sm:p-8 shadow-xl shadow-black/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Kanban size={18} className="text-indigo-400" />
            <h3 className="text-lg font-bold text-white font-serif tracking-tight">Deliverable Pipeline</h3>
          </div>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mt-1">
            Visual Kanban workflow for {clientName} project deliverables (4 stages).
            {canManage
              ? ' Management access enabled to approve progressions and advance stages.'
              : ' Request stage progression to submit tasks for team lead review.'}
          </p>
        </div>
        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.06] uppercase font-bold shrink-0 self-start sm:self-center">
          {tasks.length} Deliverables
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-zinc-500">Loading pipeline...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => col.keyMatch.includes(t.status));
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`p-4 rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/40 to-zinc-950/95 border ${col.color} min-h-[300px] flex flex-col justify-start shadow-xl shadow-black/30 transition-all duration-300`}
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                      {col.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-white/[0.06] ${col.badgeColor}`}>
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colTasks.length === 0 ? (
                    <p className="text-[11px] text-zinc-600 text-center py-16 font-mono">No tasks</p>
                  ) : (
                    colTasks.map((t) => {
                      const isDone = col.id === 'completed';
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          className="p-3.5 rounded-2xl bg-zinc-950/90 border border-white/[0.06] text-xs text-zinc-200 cursor-grab active:cursor-grabbing hover:border-orange-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 shadow-sm space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-white text-xs leading-snug group-hover:text-orange-300 transition-colors font-sans">{t.title}</p>
                            {isDone && (
                              <button
                                onClick={(e) => handleVote(e, t.id)}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-[10px] font-mono"
                                title="Vote on approved deliverable"
                              >
                                <ThumbsUp size={10} />
                                <span>{t.vote_count || 0}</span>
                              </button>
                            )}
                          </div>

                          {/* Assignee & Due Date */}
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-900">
                            <span className="text-orange-400 font-medium truncate max-w-[100px]">
                              {t.assignee_name || clientName}
                            </span>
                            {t.due_date && <span className="text-zinc-500">{t.due_date.slice(5)}</span>}
                          </div>

                          {/* Pending Progression Request Badge */}
                          {t.requested_status && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span>⏳ Requested: {t.requested_status.toUpperCase()}</span>
                              </div>
                              {canManage && (
                                <button
                                  onClick={() => handleMoveImmediate(t.id, t.requested_status)}
                                  className="w-full py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold uppercase text-[9px] hover:bg-amber-400 transition-colors shadow-sm"
                                >
                                  ✓ Approve Progression
                                </button>
                              )}
                            </div>
                          )}

                          {/* Progression Controls */}
                          <div className="pt-1 flex items-center justify-between text-[10px] font-mono">
                            {canManage ? (
                              <select
                                value={t.status}
                                onChange={(e) => handleMoveImmediate(t.id, e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 outline-none"
                              >
                                <option value="open">To-do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="in_review">In Review</option>
                                <option value="completed">Done</option>
                              </select>
                            ) : (
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) handleRequestProgression(t.id, e.target.value);
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 outline-none"
                              >
                                <option value="" disabled>Request Move to...</option>
                                <option value="open">To-do</option>
                                <option value="in_progress">In Progress</option>
                                <option value="in_review">In Review</option>
                                <option value="completed">Done</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedBrandGuidelinesView ───
function IntegratedBrandGuidelinesView({
  projectId,
  clientName,
  canManage = false,
}: {
  projectId: string;
  clientName: string;
  canManage?: boolean;
}) {
  const [data, setData] = useState<{
    colors: { name: string; hex: string }[];
    typography: string;
    typography_rules: string[];
    notes: string;
    tone_directives: string[];
  }>({
    colors: [
      { name: 'Primary Black', hex: '#000000' },
      { name: 'Clean White', hex: '#FFFFFF' },
      { name: 'Campaign Orange', hex: '#F97316' },
      { name: 'Accent Gold', hex: '#F59E0B' },
    ],
    typography: 'Inter / SF Pro for digital UI; Serif headlines for editorial campaigns.',
    typography_rules: [
      'Display Headlines: Serif / Bold high-impact editorial weights',
      'Body Copy: Clean sans-serif (Inter / SF Pro) at 14-16px with 1.6 line height',
      'Microcopy & Code: Monospaced uppercase with loose tracking',
    ],
    notes: 'Maintain strict minimal contrast ratios and use high-energy photographic assets.',
    tone_directives: [
      'Bold & Minimalist: Confident, direct tone without unnecessary filler or marketing fluff',
      'Modern High-Tech: Professional, precise terminology suitable for contemporary digital platforms',
      'Consistent Voice: Keep all customer communications empathetic yet authoritative',
    ],
  });
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchGuidelines = () => {
    fetch(`/api/projects/${projectId}/brand-data?module=guidelines`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setData((prev) => ({
            ...prev,
            ...res.data,
            colors: Array.isArray(res.data.colors) ? res.data.colors : prev.colors,
            typography_rules: Array.isArray(res.data.typography_rules)
              ? res.data.typography_rules
              : prev.typography_rules,
            tone_directives: Array.isArray(res.data.tone_directives)
              ? res.data.tone_directives
              : prev.tone_directives,
          }));
        }
      })
      .catch(() => {});
  };

  const fetchGuidelineFiles = () => {
    fetch(`/api/projects/${projectId}/files?category=brand_guideline`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setFiles(res.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchGuidelines();
    fetchGuidelineFiles();
  }, [projectId]);

  const handleSave = async () => {
    if (!canManage) return;
    setIsSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/brand-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'guidelines', data }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddColor = () => {
    setData((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: 'New Color', hex: '#6366F1' }],
    }));
  };

  const handleDeleteColor = (index: number) => {
    setData((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleAddTypographyRule = () => {
    setData((prev) => ({
      ...prev,
      typography_rules: [...prev.typography_rules, 'New typography rule...'],
    }));
  };

  const handleDeleteTypographyRule = (index: number) => {
    setData((prev) => ({
      ...prev,
      typography_rules: prev.typography_rules.filter((_, i) => i !== index),
    }));
  };

  const handleAddToneDirective = () => {
    setData((prev) => ({
      ...prev,
      tone_directives: [...prev.tone_directives, 'New tone of voice directive...'],
    }));
  };

  const handleDeleteToneDirective = (index: number) => {
    setData((prev) => ({
      ...prev,
      tone_directives: prev.tone_directives.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !canManage) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'brand_guideline');
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchGuidelineFiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!canManage || !confirm('Permanently delete this brand guideline document?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/files?id=${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchGuidelineFiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Brand Guidelines</h3>
          <p className="text-xs text-zinc-400">
            Official visual tokens, color palettes, and typography for {clientName}
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-orange-600 hover:bg-orange-500 text-white text-xs">
            {isSaving ? 'Saving...' : 'Save Guidelines'}
          </Button>
        )}
      </div>

      {/* Color Palette Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-mono uppercase text-zinc-400">Color Palette</h4>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddColor}
              className="h-7 text-xs border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
            >
              <Plus size={12} className="mr-1" /> Add Color Swatch
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.colors.map((c, i) => (
            <div key={i} className="relative p-3 rounded-xl bg-zinc-950 border border-zinc-800 group">
              <div
                className="h-14 rounded-lg mb-2 border border-zinc-800 shadow-inner"
                style={{ background: c.hex }}
              />
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleDeleteColor(i)}
                  className="absolute top-2 right-2 p-1 rounded-md bg-black/70 hover:bg-rose-900/80 text-zinc-400 hover:text-rose-200 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove color swatch"
                >
                  <Trash2 size={12} />
                </button>
              )}
              <input
                type="text"
                disabled={!canManage}
                value={c.name}
                onChange={(e) => {
                  const updated = [...data.colors];
                  updated[i].name = e.target.value;
                  setData({ ...data, colors: updated });
                }}
                className="text-xs font-medium text-white bg-transparent outline-none w-full disabled:opacity-80"
              />
              <input
                type="text"
                disabled={!canManage}
                value={c.hex}
                onChange={(e) => {
                  const updated = [...data.colors];
                  updated[i].hex = e.target.value;
                  setData({ ...data, colors: updated });
                }}
                className="text-[10px] font-mono text-zinc-400 bg-transparent outline-none w-full disabled:opacity-80"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Typography & Tone Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Typography Rules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase text-zinc-400">Typography Rules</h4>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddTypographyRule}
                className="h-6 text-[10px] font-mono border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
              >
                <Plus size={11} className="mr-1" /> Add Rule
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {data.typography_rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <input
                  type="text"
                  disabled={!canManage}
                  value={rule}
                  onChange={(e) => {
                    const updated = [...data.typography_rules];
                    updated[idx] = e.target.value;
                    setData({ ...data, typography_rules: updated });
                  }}
                  className="flex-1 bg-transparent text-xs text-zinc-200 outline-none disabled:opacity-80"
                />
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTypographyRule(idx)}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete typography rule"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tone & Voice Direction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase text-zinc-400">Tone &amp; Voice Directives</h4>
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddToneDirective}
                className="h-6 text-[10px] font-mono border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
              >
                <Plus size={11} className="mr-1" /> Add Directive
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {data.tone_directives.map((dir, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <input
                  type="text"
                  disabled={!canManage}
                  value={dir}
                  onChange={(e) => {
                    const updated = [...data.tone_directives];
                    updated[idx] = e.target.value;
                    setData({ ...data, tone_directives: updated });
                  }}
                  className="flex-1 bg-transparent text-xs text-zinc-200 outline-none disabled:opacity-80"
                />
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDeleteToneDirective(idx)}
                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                    title="Delete tone directive"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Guideline Files & Images */}
      <div className="pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-xs font-mono uppercase text-zinc-400">Guideline Documents &amp; Asset Specs</h4>
            <p className="text-[11px] text-zinc-500">PDF brand books, vector lockups, and official imagery</p>
          </div>
          {canManage && (
            <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-mono flex items-center gap-1.5 border border-zinc-700 transition-colors">
              <Plus size={13} />
              <span>{uploading ? 'Uploading...' : 'Upload Spec File'}</span>
              <input type="file" onChange={handleFileUpload} disabled={uploading} className="hidden" accept=".pdf,.png,.svg,.jpg,.jpeg,.webp" />
            </label>
          )}
        </div>

        {files.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No brand guideline files attached yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {files.map((f) => (
              <div key={f.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2 group">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="h-4 w-4 text-orange-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-medium text-white truncate">{f.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{(f.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={f.file_path}
                    download={f.name}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                    title="Download File"
                  >
                    <Download size={13} />
                  </a>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(f.id)}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:bg-rose-900/50 text-zinc-400 hover:text-rose-200 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Component: IntegratedMoodBoardView ───
function IntegratedMoodBoardView({
  projectId,
  clientName,
  canManage = false,
}: {
  projectId: string;
  clientName: string;
  canManage?: boolean;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tag, setTag] = useState('Campaign');

  useEffect(() => {
    fetch(`/api/projects/${projectId}/brand-data?module=moodboard`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data && Array.isArray(res.data)) setItems(res.data);
      })
      .catch(() => {});
  }, [projectId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;
    const newItem = {
      id: `mb_${Date.now()}`,
      title,
      imageUrl,
      linkUrl: linkUrl.trim() || imageUrl.trim(),
      tag,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setTitle('');
    setImageUrl('');
    setLinkUrl('');
    setIsOpen(false);
    await fetch(`/api/projects/${projectId}/brand-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: 'moodboard', data: updated }),
    });
  };

  const handleDelete = async (itemId: string) => {
    const updated = items.filter((x) => x.id !== itemId);
    setItems(updated);
    try {
      await fetch(`/api/projects/${projectId}/brand-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'moodboard', data: updated }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Mood Board</h3>
          <p className="text-xs text-zinc-400">Visual inspiration and creative direction for {clientName}</p>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Reference
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="py-14 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-xs font-mono text-zinc-500">
          No moodboard items yet. Click &quot;Add Reference&quot; to pin images.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {items.map((item) => {
            const destinationUrl = item.linkUrl || item.imageUrl;
            return (
              <div
                key={item.id}
                className="relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-colors shadow-sm"
              >
                <a
                  href={destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  title="Open reference link"
                >
                  <div
                    className="h-36 bg-cover bg-center bg-zinc-900 flex items-center justify-center relative group-hover:opacity-90 transition-opacity"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                  >
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 text-white text-xs font-mono border border-white/20">
                        <ExternalLink size={12} /> Visit Reference
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-white truncate">{item.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">{item.tag}</span>
                      <span className="text-[10px] text-orange-400 font-mono flex items-center gap-0.5">
                        Link <ExternalLink size={10} />
                      </span>
                    </div>
                  </div>
                </a>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-900/80 text-zinc-400 hover:text-rose-200 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete moodboard card"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-4">Add Moodboard Reference</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Editorial Contrast Vibe"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Reference URL (Website / Article)</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://dribbble.com/... (defaults to image URL)"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Category / Tag</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
                >
                  <option value="Campaign">Campaign</option>
                  <option value="Branding">Branding</option>
                  <option value="Typography">Typography</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Digital">Digital / Web</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-500 text-white">Save Reference</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedAssetLibraryView (Brand Asset Management Hub) ───
function IntegratedAssetLibraryView({
  projectId,
  clientName,
  canManage = false,
}: {
  projectId: string;
  clientName: string;
  canManage?: boolean;
}) {
  const [files, setFiles] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'logos' | 'fonts' | 'tokens' | 'press'>('all');
  const [uploading, setUploading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  const fetchAssets = () => {
    fetch(`/api/projects/${projectId}/files?category=asset`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setFiles(res.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAssets();
  }, [projectId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !canManage) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'asset');

      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        fetchAssets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAsset = async (fileId: string) => {
    if (!canManage || !confirm('Permanently delete this brand asset?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/files?id=${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAssets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToken = (text: string, label: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedToken(label);
      setTimeout(() => setCopiedToken(null), 1800);
    }
  };

  const defaultBrandTokens = [
    { label: 'Primary Brand Color', varName: '--brand-primary', value: '#09090B' },
    { label: 'Brand Accent Orange', varName: '--brand-accent', value: '#F97316' },
    { label: 'Brand Surface White', varName: '--brand-surface', value: '#FFFFFF' },
    { label: 'Primary Display Font', varName: '--font-display', value: '"Inter", sans-serif' },
  ];

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-400" />
            Asset Library &amp; Design System
          </h3>
          <p className="text-xs text-zinc-400">
            Production-ready vector logos, design tokens, typography packages, and media assets for {clientName}.
          </p>
        </div>

        {canManage && (
          <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors shrink-0">
            <Plus size={13} />
            <span>{uploading ? 'Uploading Asset...' : 'Upload Brand Asset'}</span>
            <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" accept=".svg,.png,.webp,.pdf,.ttf,.woff,.woff2,.json" />
          </label>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3">
        {[
          { id: 'all', label: 'All Brand Assets' },
          { id: 'logos', label: 'Logos & Marks' },
          { id: 'tokens', label: 'CSS & Design Tokens' },
          { id: 'press', label: 'Press & Media Kit' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
              activeCategory === tab.id
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Design Tokens Section */}
      {(activeCategory === 'all' || activeCategory === 'tokens') && (
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Live Design Tokens &amp; CSS Variables
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {defaultBrandTokens.map((tok) => (
              <div
                key={tok.varName}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-2"
              >
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{tok.label}</span>
                  <p className="text-xs font-mono text-orange-400 font-semibold mt-0.5">{tok.varName}</p>
                  <p className="text-xs font-mono text-zinc-300">{tok.value}</p>
                </div>
                <button
                  onClick={() => copyToken(`${tok.varName}: ${tok.value};`, tok.varName)}
                  className="w-full py-1 rounded bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-[10px] font-mono text-zinc-300 transition-colors"
                >
                  {copiedToken === tok.varName ? '✓ Copied Token' : 'Copy CSS'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Brand Assets */}
      {(activeCategory === 'all' || activeCategory !== 'tokens') && (
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Production Deliverables &amp; Master Files
          </h4>

          {files.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-xs font-mono text-zinc-500">
              No brand assets uploaded yet. Use the upload button above to add production logos, fonts, and assets.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((f) => {
                const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                          {ext}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
                            {f.name}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-500">
                            {(f.file_size / 1024).toFixed(1)} KB · {formatTimeAgo(f.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => setPreviewFile(f)}
                        className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={f.file_path}
                          download={f.name}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors"
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </a>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(f.id)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-200 transition-colors"
                            title="Delete asset"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white truncate max-w-md">{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-auto flex items-center justify-center p-4 bg-zinc-950 rounded-xl">
              {previewFile.mime_type?.startsWith('image/') ||
              previewFile.name.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i) ? (
                <img
                  src={previewFile.file_path}
                  alt={previewFile.name}
                  className="max-h-[55vh] object-contain rounded-lg mx-auto"
                />
              ) : previewFile.mime_type === 'application/pdf' ||
                previewFile.name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewFile.file_path}
                  title={previewFile.name}
                  className="w-full h-[60vh] rounded-xl border border-zinc-800"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto mb-2 text-zinc-500" />
                  <p className="text-xs text-zinc-300 font-mono">{previewFile.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Direct inline preview unavailable for this format.</p>
                  <a
                    href={previewFile.file_path}
                    download={previewFile.name}
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold hover:bg-orange-500"
                  >
                    <Download size={13} /> Download Asset
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedReviewApprovalView ───
function IntegratedReviewApprovalView({
  projectId,
  clientName,
  isClient = false,
  canManage = false,
}: {
  projectId: string;
  clientName: string;
  isClient?: boolean;
  canManage?: boolean;
}) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [quickPreview, setQuickPreview] = useState<{ url: string; title: string } | null>(null);
  const [stage, setStage] = useState<'concept' | 'final'>('final');
  const [feedbackPromptId, setFeedbackPromptId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<string>('changes_requested');
  const [feedbackText, setFeedbackText] = useState('');

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/approvals`);
      if (res.ok) {
        const json = await res.json();
        setApprovals(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [projectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'approval');
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.file_path) {
          setFileUrl(json.data.file_path);
          setFileName(json.data.name || file.name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, file_url: fileUrl, stage }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setFileUrl('');
        setFileName('');
        setIsSubmitOpen(false);
        fetchApprovals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (id: string, status: string, feedback?: string) => {
    try {
      await fetch(`/api/projects/${projectId}/approvals`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_id: id, status, feedback }),
      });
      setFeedbackPromptId(null);
      setFeedbackText('');
      fetchApprovals();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteApproval = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deliverable review item?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/approvals?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchApprovals();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Review &amp; Approval</h3>
          <p className="text-xs text-zinc-400">
            2-tier review: Internal Team Lead sign-off followed by direct Client approval
          </p>
        </div>
        {!isClient && (
          <Button size="sm" onClick={() => setIsSubmitOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Submit Deliverable
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500 font-mono">Loading approval items...</div>
      ) : approvals.length === 0 ? (
        <div className="p-10 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center">
          <p className="text-sm font-semibold text-white mb-1">All clear! ☕</p>
          <p className="text-xs text-zinc-400">No assets currently pending review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((app) => {
            const isLeadPending = app.status === 'pending_lead_review';
            const isClientPending = app.status === 'pending_client_review';
            const isApproved = app.status === 'approved' || app.status === 'final';
            const isLeadChanges = app.status === 'changes_requested_by_lead';
            const isClientChanges = app.status === 'changes_requested_by_client';

            let badgeClass = 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
            let badgeText = 'PENDING LEAD REVIEW';

            if (isClientPending) {
              badgeClass = 'bg-sky-500/15 text-sky-400 border border-sky-500/20';
              badgeText = 'PENDING CLIENT REVIEW';
            } else if (isApproved) {
              badgeClass = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
              badgeText = 'APPROVED ✓';
            } else if (isLeadChanges) {
              badgeClass = 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
              badgeText = 'CHANGES REQUESTED (LEAD)';
            } else if (isClientChanges) {
              badgeClass = 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
              badgeText = 'CHANGES REQUESTED (CLIENT)';
            }

            return (
              <div key={app.id} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{app.title}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-zinc-800 text-zinc-300">
                      {app.stage}
                    </span>
                  </div>
                  <span className={cn('text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded', badgeClass)}>
                    {badgeText}
                  </span>
                </div>

                {app.description && (
                  <p className="text-xs text-zinc-300 mb-3">{app.description}</p>
                )}

                {/* Attached Deliverable File with Quick View */}
                {app.file_url && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={15} className="text-orange-400 shrink-0" />
                      <span className="text-xs font-mono text-zinc-300 truncate">
                        {app.file_url.split('/').pop()?.replace(/^file_[^_]+_/, '') || 'Deliverable Asset'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuickPreview({ url: app.file_url, title: app.title })}
                        className="h-7 text-xs text-zinc-300 hover:text-white"
                      >
                        <Eye size={13} className="mr-1 text-orange-400" /> Quick View
                      </Button>
                      <a href={app.file_url} download target="_blank" rel="noreferrer">
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-zinc-300 hover:text-white">
                          <Download size={13} />
                        </Button>
                      </a>
                    </div>
                  </div>
                )}

                {app.feedback && (
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-rose-300 mb-3">
                    <strong>Feedback from {app.reviewer_name || 'Reviewer'}:</strong> {app.feedback}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500">
                  <span>Submitted by {app.submitter_name || 'Member'} · {formatTimeAgo(app.created_at)}</span>

                  {/* 2-Tier Action Controls */}
                  <div className="flex items-center gap-2">
                    {/* Team Lead Actions on Member Submissions */}
                    {isLeadPending && canManage && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(app.id, 'pending_client_review')}
                          className="h-7 text-xs bg-orange-600 hover:bg-orange-500 text-white font-bold"
                          title="Lead approves deliverable to advance it to client review"
                        >
                          <CheckCircle2 size={12} className="mr-1" /> Approve &amp; Forward to Client
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFeedbackPromptId(app.id);
                            setFeedbackStatus('changes_requested_by_lead');
                          }}
                          className="h-7 text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                        >
                          Request Changes
                        </Button>
                      </>
                    )}

                    {/* Client Actions on Forwarded Submissions */}
                    {isClientPending && isClient && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(app.id, 'approved')}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          <CheckCircle2 size={12} className="mr-1" /> Approve Deliverable
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFeedbackPromptId(app.id);
                            setFeedbackStatus('changes_requested_by_client');
                          }}
                          className="h-7 text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                        >
                          Request Changes
                        </Button>
                      </>
                    )}

                    {/* Team Lead / Admin Override on Client Pending */}
                    {isClientPending && canManage && !isClient && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(app.id, 'approved')}
                        className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                        title="Override and approve on client behalf"
                      >
                        ✓ Client Sign-off (Override)
                      </Button>
                    )}

                    {/* Delete Deliverable (Team Lead & Admin only) */}
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteApproval(app.id)}
                        className="h-7 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete review item"
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Feedback Input Prompt */}
                {feedbackPromptId === app.id && (
                  <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <textarea
                      rows={2}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Specify requested changes for the team..."
                      className="w-full p-2 text-xs bg-zinc-950 border border-zinc-800 rounded-lg text-white outline-none resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setFeedbackPromptId(null)}>Cancel</Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(app.id, feedbackStatus, feedbackText)}
                        className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
                      >
                        Submit Changes Request
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick View Modal */}
      {quickPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white truncate max-w-md">{quickPreview.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <a href={quickPreview.url} download target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:text-white">
                    <Download size={12} className="mr-1" /> Download
                  </Button>
                </a>
                <button onClick={() => setQuickPreview(null)} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-950 rounded-xl p-3 min-h-[360px]">
              {quickPreview.url.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i) ? (
                <img src={quickPreview.url} alt={quickPreview.title} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              ) : quickPreview.url.match(/\.pdf$/i) ? (
                <iframe src={quickPreview.url} className="w-full h-[70vh] rounded-lg border-0" title={quickPreview.title} />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText size={48} className="mx-auto text-orange-400" />
                  <p className="text-xs text-zinc-300 font-mono">{quickPreview.title}</p>
                  <a href={quickPreview.url} download target="_blank" rel="noreferrer">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white text-xs">
                      <Download size={13} className="mr-1.5" /> Download Deliverable File
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal with File Attachment */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-4">
              {canManage ? 'Submit Deliverable for Client Review' : 'Submit Deliverable for Team Lead Review'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Campaign Billboard Layout Final"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Stage</label>
                <select
                  value={stage}
                  onChange={(e: any) => setStage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none"
                >
                  <option value="final">Final Deliverable</option>
                  <option value="concept">Concept / Draft</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Deliverable File / Asset</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-orange-500/50 text-xs text-zinc-300 cursor-pointer transition-colors flex-1">
                    <FileText size={14} className="text-orange-400" />
                    <span className="truncate">{fileName || 'Attach deliverable (image, PDF, mock)...'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                  </label>
                  {fileUrl && (
                    <button
                      type="button"
                      onClick={() => { setFileUrl(''); setFileName(''); }}
                      className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800"
                      title="Remove attachment"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                {uploadingFile && <p className="text-[10px] font-mono text-orange-400 mt-1">Uploading file...</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions, export format notes, or review criteria..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsSubmitOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={uploadingFile} className="bg-orange-600 hover:bg-orange-500 text-white">
                  {uploadingFile ? 'Uploading...' : 'Submit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedDocsFilesView ───
function IntegratedDocsFilesView({
  projectId,
  canManage = false,
}: {
  projectId: string;
  canManage?: boolean;
}) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [storageQuota, setStorageQuota] = useState<any | null>(null);

  const fetchStorageQuota = async () => {
    try {
      const res = await fetch('/api/storage');
      if (res.ok) {
        const json = await res.json();
        if (json.data) setStorageQuota(json.data);
      }
    } catch {}
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`);
      if (res.ok) {
        const json = await res.json();
        setFiles(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchStorageQuota();
  }, [projectId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'general');

    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to permanently delete this file?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/files?id=${fileId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Docs &amp; Files</h3>
          <p className="text-xs text-zinc-400">Central file repository for documents, briefs, and deliverables</p>
        </div>
        <div>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold cursor-pointer">
            <Plus size={14} />
            <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
            <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* ── 2TB Storage Vault Status Banner ── */}
      {storageQuota && (
        <div className="mb-5 p-3.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
              <HardDrive size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-sans">2TB Unified Storage Vault</span>
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.08] font-semibold">
                  {storageQuota.activeProvider === 'google-drive'
                    ? 'Google Drive 2TB API'
                    : storageQuota.activeProvider === 'r2'
                    ? 'Cloudflare R2 (Edge Zero-Egress)'
                    : 'Local Vault (Ready for GDrive / R2)'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                {storageQuota.formattedUsed} used of {storageQuota.formattedTotal} ({storageQuota.usagePercentage}% allocated)
              </p>
            </div>
          </div>
          <div className="w-full sm:w-44 space-y-1">
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(storageQuota.usagePercentage, 1)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span>0 TB</span>
              <span>2.0 TB Cap</span>
            </div>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="py-14 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-xs font-mono text-zinc-500">
          No files uploaded yet. Click &quot;Upload File&quot; to add documents.
        </div>
      ) : (
        <div className="space-y-2.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-orange-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{file.name}</p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {(file.file_size / 1024).toFixed(1)} KB · {formatTimeAgo(file.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-white/[0.04]">
                  {file.storage_provider === 'google-drive' ? 'GDrive' : file.storage_provider === 'r2' ? 'R2' : 'Vault'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewFile(file)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  <Eye size={14} className="mr-1" /> Quick View
                </Button>
                <a href={file.file_path} download={file.name}>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                    <Download size={14} />
                  </Button>
                </a>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10"
                    title="Delete file"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Preview Modal with PDF and Image Support */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-3xl p-6 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white truncate max-w-md">{previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-auto flex items-center justify-center p-4 bg-zinc-950 rounded-xl">
              {previewFile.mime_type?.startsWith('image/') ||
              previewFile.name.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i) ? (
                <img
                  src={previewFile.file_path}
                  alt={previewFile.name}
                  className="max-h-[55vh] object-contain rounded-lg mx-auto"
                />
              ) : previewFile.mime_type === 'application/pdf' ||
                previewFile.name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewFile.file_path}
                  title={previewFile.name}
                  className="w-full h-[60vh] rounded-xl border border-zinc-800"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto mb-2 text-zinc-500" />
                  <p className="text-xs text-zinc-300 font-mono">{previewFile.name}</p>
                  <p className="text-[11px] text-zinc-500 mt-1">Preview not supported inline for this file format.</p>
                  <a
                    href={previewFile.file_path}
                    download={previewFile.name}
                    className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-semibold"
                  >
                    <Download size={12} /> Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedScheduleView (Schedule, Milestones, Task Deadlines & Delay Tracking) ───
function IntegratedScheduleView({
  projectId,
  dueDate,
  canManage = false,
}: {
  projectId: string;
  dueDate: string;
  canManage?: boolean;
}) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Milestone Form state (Admin / Team Lead only)
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [milestoneDesc, setMilestoneDesc] = useState('');
  const [savingMilestone, setSavingMilestone] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch Calendar Events & Milestones
      const evtRes = await fetch('/api/events');
      if (evtRes.ok) {
        const json = await evtRes.json();
        const evts = (json.data || []).filter((e: any) => e.project_id === projectId);
        setMilestones(evts);
      }

      // 2. Fetch Tasks with Deadlines
      const todoRes = await fetch(`/api/projects/${projectId}/todos`);
      if (todoRes.ok) {
        const json = await todoRes.json();
        let tasksList: any[] = [];
        if (Array.isArray(json.data)) {
          tasksList = json.data.flatMap((item: any) => (item.todos ? item.todos : [item]));
        }
        setTasks(tasksList.filter((t) => t && t.title));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim() || !milestoneDate || !canManage) return;

    setSavingMilestone(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: milestoneTitle.trim(),
          description: milestoneDesc.trim() || null,
          start_at: `${milestoneDate}T09:00:00Z`,
          end_at: `${milestoneDate}T18:00:00Z`,
          is_all_day: true,
          project_id: projectId,
        }),
      });

      if (res.ok) {
        setMilestoneTitle('');
        setMilestoneDate('');
        setMilestoneDesc('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingMilestone(false);
    }
  };

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-orange-400" />
          Schedule &amp; Milestones
        </h3>
        <p className="text-xs text-zinc-400">
          Key deadlines, delivery milestones, and task timelines for this project
        </p>
      </div>

      {/* ── 1. Milestones Section ── */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          Project Milestones
        </h4>

        <div className="space-y-2.5">
          {/* Default Target Delivery Milestone */}
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-xs font-medium text-white">Project Milestone Target Delivery</p>
                <p className="text-[10px] text-zinc-500 font-mono">Final Project Launch</p>
              </div>
            </div>
            <span className="text-xs font-mono text-zinc-300 font-bold">{dueDate}</span>
          </div>

          {/* Dynamic Milestones from DB */}
          {milestones.map((m) => (
            <div key={m.id} className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-white">{m.title}</p>
                  {m.description && <p className="text-[10px] text-zinc-500 font-mono">{m.description}</p>}
                </div>
              </div>
              <span className="text-xs font-mono text-orange-300">
                {m.start_at ? m.start_at.slice(0, 10) : dueDate}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Add Milestone Form (Admin & Team Lead Only) ── */}
      {canManage && (
        <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5">
              <Plus size={13} />
              Add Milestone (Admin &amp; Team Lead Only)
            </h4>
            <span className="text-[10px] font-mono text-zinc-500">Synced with Dashboard Calendar</span>
          </div>

          <form onSubmit={handleAddMilestone} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Milestone Title (e.g. Concept Sign-Off)"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-700 text-xs text-white h-9"
              />
              <Input
                type="date"
                value={milestoneDate}
                onChange={(e) => setMilestoneDate(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-700 text-xs text-zinc-200 font-mono h-9"
              />
            </div>
            <Input
              placeholder="Description or delivery scope notes..."
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-xs text-white h-9"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={savingMilestone || !milestoneTitle.trim() || !milestoneDate}
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-4 h-8"
              >
                {savingMilestone ? 'Adding...' : 'Add Milestone'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── 3. Task Deadlines & Delayed Status Tracking ── */}
      <div className="space-y-3 pt-2 border-t border-zinc-800">
        <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          Task Deadlines &amp; Timelines
        </h4>

        {tasks.length === 0 ? (
          <p className="text-xs font-mono text-zinc-500 py-4 text-center">No tasks recorded in this project.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isDone = task.status === 'completed' || task.status === 'done';
              const isDelayed = !isDone && task.due_date && new Date(task.due_date) < new Date();

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 truncate flex-1">
                    <div className="h-3.5 w-3.5 rounded border border-zinc-600 flex items-center justify-center shrink-0">
                      {isDone && <CheckSquare className="h-3 w-3 text-emerald-400" />}
                    </div>
                    <div className="truncate">
                      <p className={cn('text-xs font-medium truncate', isDone ? 'line-through text-zinc-500' : 'text-zinc-200')}>
                        {task.title}
                      </p>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {task.assignee_name ? `Assigned to: ${task.assignee_name}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                    <span className="text-zinc-400">
                      {task.due_date ? `Due: ${task.due_date}` : 'No deadline'}
                    </span>

                    {/* Delayed Alert Badge — Strictly for Admin and Team Lead */}
                    {isDelayed && canManage && (
                      <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400 font-bold uppercase tracking-wider text-[9px]">
                        TASK DELAYED
                      </span>
                    )}

                    <span className="uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {task.status || 'open'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Component: IntegratedDeliverablesView ───
function IntegratedDeliverablesView({
  projectId,
  clientName,
}: {
  projectId: string;
  clientName: string;
}) {
  const [deliverables, setDeliverables] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/files?category=deliverable`).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/projects/${projectId}/approvals`).then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([filesRes, approvalsRes]) => {
      const files = filesRes.data || [];
      const approvedApprovals = (approvalsRes.data || [])
        .filter((a: any) => (a.status === 'approved' || a.status === 'final') && a.file_url)
        .map((a: any) => ({
          id: a.id,
          name: a.title,
          file_path: a.file_url,
          file_size: 1048576,
          created_at: a.updated_at || a.created_at,
          stage: a.stage,
        }));

      const map = new Map();
      files.forEach((f: any) => map.set(f.file_path, f));
      approvedApprovals.forEach((a: any) => {
        if (!map.has(a.file_path)) map.set(a.file_path, a);
      });
      setDeliverables(Array.from(map.values()));
    });
  }, [projectId]);

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-base font-semibold text-white mb-1">Deliverables</h3>
      <p className="text-xs text-zinc-400 mb-6">View and export all finalized project assets for {clientName}</p>

      {deliverables.length === 0 ? (
        <div className="py-14 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-xs font-mono text-zinc-500">
          All approved deliverables will appear here once finalized in review.
        </div>
      ) : (
        <div className="space-y-3">
          {deliverables.map((del) => (
            <div key={del.id} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-orange-400" />
                <div>
                  <p className="text-xs font-semibold text-white">{del.name}</p>
                  <p className="text-[10px] font-mono text-zinc-500">Final Deliverable · {(del.file_size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <a href={del.file_path} download={del.name}>
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedAnalyticsView (Single Unified Omni-Route AI Analytics & Tracker) ───
function IntegratedAnalyticsView({
  projectId,
  projectName,
  clientName,
}: {
  projectId: string;
  projectName: string;
  clientName: string;
}) {
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [customQuery, setCustomQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [providerUsed, setProviderUsed] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text || '');
    };
    reader.readAsText(file);
  };

  const loadSampleDataset = () => {
    const sample = `channel,impressions,clicks,conversions,spend
Instagram Reels,684000,32400,1840,4200
TikTok Ads,512000,28900,1420,3800
YouTube Shorts,314000,14200,910,2400
LinkedIn B2B,178000,8600,480,1800
Google Search,240000,19200,1250,2900`;
    setFileName('campaign_performance_q3.csv');
    setFileContent(sample);
  };

  const runAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAnalyzing(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: fileName,
          file_content: fileContent,
          custom_query: customQuery,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setAnalyticsData(json.data);
          setProviderUsed(json.provider || 'Omni-Route');
        }
      }
    } catch (err) {
      console.error('Analytics analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange-400" />
            Analytics &amp; Tracker
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Omni-Route AI intelligence for {projectName} — Upload files to generate interactive charts, distribution tables, and executive summaries.
          </p>
        </div>
        {providerUsed && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 font-semibold uppercase tracking-wider self-start sm:self-center">
            ROUTED VIA: {providerUsed.toUpperCase()}
          </span>
        )}
      </div>

      {/* Upload and Dataset Section */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 hover:border-orange-500 hover:text-white cursor-pointer transition-colors shrink-0">
              <Upload size={14} className="text-orange-400" />
              <span>Choose Datafile (CSV, JSON, TXT, Excel)</span>
              <input
                type="file"
                accept=".csv,.json,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <span className="text-xs font-mono text-zinc-400 truncate">
              {fileName ? `Loaded: ${fileName}` : 'No file selected (or load sample)'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadSampleDataset}
              className="text-xs font-mono border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white h-8"
            >
              Load Sample Dataset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={analyzing}
              onClick={() => runAnalysis()}
              className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-mono uppercase tracking-wider font-semibold h-8 px-4"
            >
              {analyzing ? 'Analyzing Data...' : 'Run AI Analysis'}
            </Button>
          </div>
        </div>

        <div>
          <Input
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Optional custom question (e.g. Focus on ROAS and channel conversion velocity)..."
            className="bg-zinc-900 border-zinc-800 text-xs text-white h-9 rounded-xl font-mono"
          />
        </div>
      </div>

      {/* Analytics Dashboard Results */}
      {analyzing ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono text-zinc-400">Omni-Routing AI analyzing dataset and calculating visual distributions...</p>
        </div>
      ) : analyticsData ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Executive Summary Card */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-zinc-200 leading-relaxed space-y-1">
            <span className="font-mono text-[10px] font-bold uppercase text-orange-400 tracking-wider">
              Executive Tracking Summary
            </span>
            <p>{analyticsData.summary}</p>
          </div>

          {/* KPI Metrics 4-Grid */}
          {analyticsData.metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analyticsData.metrics.map((m: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                    {m.label}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-white font-mono">{m.value}</span>
                    {m.delta && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        m.isPositive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visual Charts */}
          {analyticsData.charts && analyticsData.charts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.charts.map((c: any, ci: number) => {
                const maxVal = Math.max(...c.data.map((d: any) => d.value || 0), 1);
                return (
                  <div key={ci} className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
                    <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center justify-between">
                      <span>{c.title}</span>
                      <span className="text-[10px] text-zinc-500">{c.type.toUpperCase()}</span>
                    </h4>

                    {/* Bar visualization */}
                    <div className="space-y-3 pt-2">
                      {c.data.map((item: any, di: number) => {
                        const pct = Math.min(Math.round((item.value / maxVal) * 100), 100);
                        return (
                          <div key={di} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-zinc-300 truncate max-w-[180px]">{item.name}</span>
                              <span className="text-orange-400 font-bold">{item.value.toLocaleString()}</span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-850 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Distribution Data Table */}
          {analyticsData.table && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  {analyticsData.table.title || 'Data Distribution Breakdown'}
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900/30 text-zinc-400 text-[10px] uppercase border-b border-zinc-850">
                    <tr>
                      {analyticsData.table.headers.map((h: string, hi: number) => (
                        <th key={hi} className="px-4 py-2.5 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/60 text-zinc-300">
                    {analyticsData.table.rows.map((row: string[], ri: number) => (
                      <tr key={ri} className="hover:bg-zinc-900/30 transition-colors">
                        {row.map((cell: string, ci: number) => (
                          <td key={ci} className={`px-4 py-2.5 ${ci === 0 ? 'text-white font-medium' : ''}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actionable Strategic Recommendations */}
          {analyticsData.actionable_insights && (
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <h4 className="text-xs font-bold text-orange-400 font-mono uppercase tracking-wider">
                Actionable Strategic Recommendations
              </h4>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {analyticsData.actionable_insights.map((ins: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold shrink-0">•</span>
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 space-y-2">
          <BarChart3 className="h-8 w-8 text-zinc-600 mx-auto" />
          <p className="text-xs font-mono text-zinc-400">Upload a dataset or load the sample data to begin AI analysis.</p>
          <p className="text-[10px] font-mono text-zinc-600">Supports CSV, JSON, TXT files. Raw data payloads and prompts are securely isolated.</p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: IntegratedWhatsAppAutomationView ───
function IntegratedWhatsAppAutomationView({
  projectId,
  projectName,
  clientName,
}: {
  projectId: string;
  projectName: string;
  clientName: string;
}) {
  const [testText, setTestText] = useState('');
  const [sentMsg, setSentMsg] = useState(false);
  const [recipientNumber, setRecipientNumber] = useState('+1 (555) 392-1084');
  const [isLiveMeta, setIsLiveMeta] = useState(false);
  const [recentDispatches, setRecentDispatches] = useState<any[]>([]);

  const fetchDispatches = async () => {
    try {
      const res = await fetch(`/api/whatsapp/messages?project_id=${projectId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setRecentDispatches(
            json.data.map((m: any) => ({
              id: m.id,
              text: m.body,
              recipient: m.phone_number || '+1 (555) 392-1084',
              status: (m.status || 'delivered').toUpperCase(),
              time: formatTimeAgo(m.created_at),
            }))
          );
        } else {
          setRecentDispatches([
            {
              id: 'wa-init',
              text: `Hello ${clientName}, new deliverables and assets have been uploaded for ${projectName}.`,
              recipient: '+1 (555) 392-1084',
              status: 'DELIVERED',
              time: 'Recent',
            },
          ]);
        }
        if (json.config?.isConfigured) {
          setIsLiveMeta(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [projectId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testText.trim()) return;
    setSentMsg(true);

    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testText.trim(),
          phone: recipientNumber,
          project_id: projectId,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const userMsg = json.data?.userMessage;
        const botMsg = json.data?.botReply;

        setRecentDispatches((prev) => [
          ...(botMsg
            ? [
                {
                  id: botMsg.id,
                  text: botMsg.body,
                  recipient: 'Assistant Bot',
                  status: 'DELIVERED',
                  time: 'Just now',
                },
              ]
            : []),
          ...(userMsg
            ? [
                {
                  id: userMsg.id,
                  text: userMsg.body,
                  recipient: recipientNumber,
                  status: 'SENT',
                  time: 'Just now',
                },
              ]
            : []),
          ...prev,
        ]);
        setTestText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSentMsg(false);
    }
  };

  return (
    <div className="rf-card bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">WhatsApp Bot &amp; Hub for {projectName}</h3>
          <p className="text-xs text-zinc-400">Direct WhatsApp integration for instant client alerts &amp; review approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-emerald-400">
            {isLiveMeta ? 'META CLOUD API ONLINE' : 'SIMULATION HUB ACTIVE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Triggers */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
          <h4 className="text-xs font-mono uppercase text-zinc-400">Active Bot Triggers</h4>
          <div className="space-y-2 text-xs text-zinc-300">
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
              <div>
                <p className="font-medium text-white">Notify {clientName} on new deliverable</p>
                <p className="text-[10px] text-zinc-500 font-mono">Dispatches WhatsApp review link</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80">
              <div>
                <p className="font-medium text-white">Alert team on client chat reply</p>
                <p className="text-[10px] text-zinc-500 font-mono">Pings team lead mobile</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div>
                <p className="font-medium text-white">Milestone completion summary</p>
                <p className="text-[10px] text-zinc-500 font-mono">Summary card with sign-off button</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Dispatch Form */}
        <form onSubmit={handleSend} className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase text-zinc-400">Dispatch WhatsApp Alert</h4>
            <span className="text-[10px] font-mono text-zinc-500">Live Webhook</span>
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Destination Phone / Group</label>
            <Input
              value={recipientNumber}
              onChange={(e) => setRecipientNumber(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white text-xs h-8 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Message Content</label>
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder={`e.g. Hi ${clientName}, new revision uploaded!`}
              className="bg-zinc-900 border-zinc-700 text-white text-xs h-8"
            />
          </div>

          <Button
            type="submit"
            disabled={!testText.trim() || sentMsg}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 font-semibold"
          >
            {sentMsg ? 'Dispatching Message...' : 'Dispatch WhatsApp Alert'}
          </Button>
        </form>
      </div>

      {/* Recent Dispatches Log */}
      <div className="pt-2 border-t border-zinc-800">
        <h4 className="text-xs font-mono uppercase text-zinc-400 mb-2">Recent WhatsApp Logs</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {recentDispatches.map((log) => (
            <div key={log.id} className="p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <span className="text-emerald-400 font-mono mr-2">{log.recipient}</span>
                <span className="text-zinc-300">{log.text}</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 shrink-0">{log.time} · {log.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
