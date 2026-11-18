'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Users,
  Settings2,
  Activity,
  Clock,
  FolderKanban,
  Mail,
  MessagesSquare,
  Palette,
  Boxes,
  Sparkles,
  Search,
  CheckCircle2,
  Circle,
  ExternalLink,
  Trophy,
} from 'lucide-react';
import { formatTimeAgo, getInitials, getAvatarColor, truncate } from '@/lib/utils';
import { APP_NAME, STATUS_COLORS } from '@/lib/constants';
import type { User, Project, AuditLog } from '@/types';

// Tab Components
import { WhatsAppHubView } from '@/components/whatsapp/whatsapp-hub-view';
import { TeamDirectoryView } from '@/components/team/team-directory-view';
import { BasecampDesignStudio } from '@/components/studio/basecamp-design-studio';
import { ModulesView } from '@/components/modules/modules-view';
import { UnifiedPipeline } from '@/components/pipeline/unified-pipeline-view';
import { HomepageDashboardView } from '@/components/dashboard/homepage-dashboard-view';
import { TeamGrowthView } from '@/components/dashboard/team-growth-view';
import { SpectraBotDialog } from '@/components/ai/spectra-bot-dialog';

// Role Dashboards
import { useRolePreview } from '@/hooks/use-role-preview';
import { AdminRoleView } from '@/components/dashboard/roles/admin-role-view';
import { BrandManagerRoleView } from '@/components/dashboard/roles/brand-manager-role-view';
import { TeamRoleView } from '@/components/dashboard/roles/team-role-view';
import { ClientRoleView } from '@/components/dashboard/roles/client-role-view';

type TabKey = 'projects' | 'pipeline' | 'whatsapp' | 'craft' | 'team' | 'studio' | 'modules';

interface DashboardContentProps {
  user: User | null;
  projects: Project[];
  activity: AuditLog[];
  greeting: string;
  members?: any[];
  tokens?: Record<string, string>;
  modules?: Record<string, boolean>;
  whatsappMessages?: any[];
  pendingApprovals?: any[];
  scheduledTasks?: any[];
  openTodos?: any[];
  pipelineTodos?: any[];
  workloadStats?: any[];
}

export function DashboardContent({
  user,
  projects,
  activity,
  greeting,
  members = [],
  tokens = {},
  modules = {},
  whatsappMessages = [],
  pendingApprovals = [],
  scheduledTasks = [],
  openTodos = [],
  pipelineTodos = [],
  workloadStats = [],
}: DashboardContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { previewRole, setPreviewRole } = useRolePreview();
  const tabParam = (searchParams.get('tab') as TabKey) || 'projects';

  const [activeTab, setActiveTab] = useState<TabKey>(tabParam);
  const [projectSearch, setProjectSearch] = useState('');

  const effectiveRole = previewRole || user?.role;
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'owner';

  // Strictly gate admin-only tabs (craft, team, studio, modules)
  useEffect(() => {
    if (!isAdmin && (activeTab === 'craft' || activeTab === 'team' || activeTab === 'studio' || activeTab === 'modules')) {
      setActiveTab('projects');
    }
  }, [isAdmin, activeTab]);

  // Keep state synchronized with URL query params
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabKey;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      if (!isAdmin && (tabFromUrl === 'craft' || tabFromUrl === 'team' || tabFromUrl === 'studio' || tabFromUrl === 'modules')) {
        setActiveTab('projects');
      } else {
        setActiveTab(tabFromUrl);
      }
    }
  }, [searchParams, isAdmin]);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'projects') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    router.replace(url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''), {
      scroll: false,
    });
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(projectSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full min-h-0" style={{ minHeight: 'calc(100vh - var(--header-height) - var(--personal-toolbar-height))' }}>
      {/* ── Top Unified Tabs Navigation (visible only for secondary tools) ── */}
      {activeTab !== 'projects' && (
      <div
        className="w-full px-6 py-3 border-b flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sticky top-0 z-20 backdrop-blur-md"
        style={{
          background: 'var(--nf-panel, #131E24)',
          borderColor: 'var(--nf-border, #35464E)',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => switchTab('projects')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <FolderKanban size={14} />
            Projects &amp; Work
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground">
              {projects.length}
            </span>
          </button>

          <button
            onClick={() => switchTab('pipeline')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <Boxes size={14} />
            Creative Pipeline
          </button>

          {isAdmin && (
            <button
              onClick={() => switchTab('craft')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                activeTab === 'craft'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy size={14} className="text-amber-400" />
              Craft &amp; Merit
            </button>
          )}

          <button
            onClick={() => switchTab('whatsapp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-teal-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessagesSquare size={15} />
            WhatsApp Hub
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {isAdmin && (
            <button
              onClick={() => switchTab('studio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'studio'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette size={15} />
              Design Studio
            </button>
          )}
        </div>

        {/* Quick project count / shortcut */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
          <span>
            Logged in as <strong className="text-white">{user?.full_name?.split(' ')[0]}</strong>
          </span>
        </div>
      </div>
      )}

      {/* ── Tab Content Views ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* TAB 1: HOMEPAGE DASHBOARD */}
        {activeTab === 'projects' && (
          <HomepageDashboardView
            user={user}
            projects={projects}
            pendingApprovals={pendingApprovals}
            scheduledTasks={scheduledTasks}
            openTodos={openTodos}
            pipelineTodos={pipelineTodos}
            workloadStats={workloadStats}
            onNavigateToStudio={() => switchTab('craft')}
          />
        )}

        {/* TAB 1.5: CREATIVE PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="p-6 max-w-7xl mx-auto">
            <UnifiedPipeline />
          </div>
        )}

        {/* TAB 2: CRAFT & MERIT ACCELERATOR STUDIO */}
        {activeTab === 'craft' && isAdmin && (
          <div className="p-6 max-w-7xl mx-auto">
            <TeamGrowthView user={user} effectiveRole={effectiveRole} mode="full" />
          </div>
        )}

        {/* TAB 3: WHATSAPP HUB */}
        {activeTab === 'whatsapp' && (
          <WhatsAppHubView initialMessages={whatsappMessages} user={user} />
        )}

        {/* TAB 4: TEAM DIRECTORY */}
        {activeTab === 'team' && isAdmin && <TeamDirectoryView initialMembers={members} />}

        {/* TAB 5: DESIGN STUDIO */}
        {activeTab === 'studio' && isAdmin && <BasecampDesignStudio initialTokens={tokens} />}

        {/* TAB 6: FEATURE MODULES */}
        {activeTab === 'modules' && isAdmin && <ModulesView initialModules={modules} />}
      </div>

      {/* Floating spectraBot Assistant */}
      <SpectraBotDialog />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const color = project.color ?? '#39C6AE';
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-2xl border p-5 transition-all hover:border-slate-400 group relative"
      style={{
        background: 'var(--nf-card, #1C2A31)',
        borderColor: 'var(--nf-border, #35464E)',
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
          style={{ background: color + '25', color }}
        >
          {getInitials(project.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold truncate group-hover:text-teal-300 transition-colors" style={{ color: 'var(--nf-text, #F2F6F8)' }}>
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--nf-text-muted, #AAB8C0)' }}>
              {truncate(project.description, 75)}
            </p>
          )}
        </div>
      </div>

      {/* Members avatars */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex -space-x-1.5">
          {project.members && project.members.length > 0 ? (
            project.members.slice(0, 4).map((member) => (
              <UserAvatar key={member.user_id} user={member.user} size="xs" />
            ))
          ) : (
            <span className="text-[10px] text-slate-500">No members</span>
          )}
        </div>

        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            background: project.status === 'active' ? 'rgba(57,198,174,0.15)' : 'rgba(170,184,192,0.15)',
            color: project.status === 'active' ? 'var(--nf-accent, #39C6AE)' : 'var(--nf-text-muted, #AAB8C0)',
          }}
        >
          {project.status}
        </span>
      </div>
    </Link>
  );
}

export function UserAvatar({ user, size = 'sm' }: { user?: any; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeMap = { xs: 'w-5 h-5 text-[8px]', sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };
  const name = user?.full_name ?? '?';
  const bg = getAvatarColor(user?.id ?? name);
  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-bold border border-slate-900 overflow-hidden flex-shrink-0`}
      style={{ background: user?.avatar_url ? 'transparent' : bg + '33', color: bg }}
      title={name}
    >
      {user?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar_url} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function ActivityItem({ item }: { item: any }) {
  return (
    <div className="flex gap-2.5 text-xs">
      <div className="flex-shrink-0 mt-0.5">
        <UserAvatar user={item.actor} size="xs" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-200">
          <span className="font-bold text-white">{item.actor?.full_name ?? 'Someone'}</span>{' '}
          {item.action}
          {item.project && (
            <>
              {' — '}
              <Link href={`/projects/${item.project.id}`} className="hover:underline text-teal-300">
                {item.project.name}
              </Link>
            </>
          )}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{formatTimeAgo(item.created_at)}</p>
      </div>
    </div>
  );
}
