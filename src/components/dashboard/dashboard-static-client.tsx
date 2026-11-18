'use client';

import { useState, useEffect, Suspense } from 'react';
import { DashboardContent } from './dashboard-content';
import type { User, Project, AuditLog } from '@/types';

export const STATIC_DASHBOARD_DATA = {
  user: {
    id: 'usr_836f261323a28ad1',
    organization_id: 'org_default',
    email: 'harikeshav@specteros.agency',
    full_name: 'Harikeshav',
    role: 'owner',
    timezone: 'Asia/Kolkata',
    locale: 'en',
    is_active: true,
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-11-18T00:00:00Z',
  } as User,
  projects: [
    {
      id: 'prj_2e2afb329d16ec4b',
      name: 'test',
      client_name: 'PROJECT',
      clientName: 'PROJECT',
      progress: 0,
      totalItems: 3,
      completedItems: 0,
      status: 'active',
      description: 'Internal testing workspace',
      organization_id: 'org_default',
      owner_id: 'usr_836f261323a28ad1',
      created_at: '2026-10-25T10:00:00Z',
      updated_at: '2026-10-25T10:00:00Z',
      settings: {},
      members: [],
    },
    {
      id: 'prj_2dc1a5bcddbd4de9',
      name: 'brand launch',
      client_name: 'PROJECT',
      clientName: 'PROJECT',
      progress: 0,
      totalItems: 3,
      completedItems: 0,
      status: 'active',
      description: 'Brand launch campaign and asset rollout',
      organization_id: 'org_default',
      owner_id: 'usr_836f261323a28ad1',
      created_at: '2026-10-24T10:00:00Z',
      updated_at: '2026-10-24T10:00:00Z',
      settings: {},
      members: [],
    },
    {
      id: 'prj_horizon',
      name: 'Editorial & Interactive Lookbook',
      client_name: 'HORIZON APPAREL',
      clientName: 'HORIZON APPAREL',
      progress: 35,
      totalItems: 4,
      completedItems: 1,
      status: 'active',
      description: 'High-fashion editorial site, lookbook and seasonal campaign',
      organization_id: 'org_default',
      owner_id: 'usr_836f261323a28ad1',
      created_at: '2026-10-22T10:00:00Z',
      updated_at: '2026-10-22T10:00:00Z',
      settings: {},
      members: [],
    },
  ] as unknown as Project[],
  pipelineTodos: [
    // TO DO (8)
    { id: 't1', title: 'coding backend', client_name: 'KALLISTO SOUND LABS', status: 'open', project_id: 'prj_kallisto' },
    { id: 't2', title: 'works hard', client_name: 'BRAND LAUNCH', status: 'open', project_id: 'prj_2dc1a5bcddbd4de9' },
    { id: 't3', title: 'Company-Wide Design Review (All Leads)', client_name: 'TEST', status: 'open', project_id: 'prj_2e2afb329d16ec4b' },
    { id: 't4', title: 'ok', client_name: 'BRAND LAUNCH', status: 'open', project_id: 'prj_2dc1a5bcddbd4de9' },
    { id: 't5', title: 'Finalize tactile recycled linen exterior', client_name: 'KALLISTO SOUND LABS', status: 'open', project_id: 'prj_kallisto' },
    { id: 't6', title: 'Render 3D exploded assembly animation', client_name: 'KALLISTO SOUND LABS', status: 'open', project_id: 'prj_kallisto' },
    { id: 't7', title: 'Implement smooth horizontal parallax layout', client_name: 'HORIZON APPAREL', status: 'open', project_id: 'prj_horizon' },
    { id: 't8', title: 'Finalize environmental sustainability metrics', client_name: 'HORIZON APPAREL', status: 'open', project_id: 'prj_horizon' },
    // IN PROGRESS (4)
    { id: 't9', title: 'need tyo finish branding', client_name: 'TEST', status: 'in_progress', project_id: 'prj_2e2afb329d16ec4b' },
    { id: 't10', title: 'complete barn design', client_name: 'BRAND LAUNCH', status: 'in_progress', project_id: 'prj_2dc1a5bcddbd4de9' },
    { id: 't11', title: 'Press check with Heidelberg print master', client_name: 'KALLISTO SOUND LABS', status: 'in_progress', project_id: 'prj_kallisto' },
    { id: 't12', title: 'Color grade 30-second campaign cut', client_name: 'HORIZON APPAREL', status: 'in_progress', project_id: 'prj_horizon' },
    // IN REVIEW (1)
    { id: 't13', title: 'work', client_name: 'TEST', status: 'in_review', project_id: 'prj_2e2afb329d16ec4b' },
    // DONE (3)
    { id: 't14', title: "Refine geometric 'K' monogram kerning", client_name: 'KALLISTO SOUND LABS', status: 'completed', project_id: 'prj_kallisto' },
    { id: 't15', title: 'Publish Pantone spot color swatches', client_name: 'KALLISTO SOUND LABS', status: 'completed', project_id: 'prj_kallisto' },
    { id: 't16', title: 'Select top 45 hero stills from Iceland shoot', client_name: 'HORIZON APPAREL', status: 'completed', project_id: 'prj_horizon' },
  ],
  openTodos: [
    { id: 'ot1', title: 'coding backend', project_name: 'Kallisto Sound Labs', status: 'open', project_id: 'prj_kallisto' },
    { id: 'ot2', title: 'works hard', project_name: 'brand launch', status: 'open', project_id: 'prj_2dc1a5bcddbd4de9' },
    { id: 'ot3', title: 'Company-Wide Design Review', project_name: 'test', status: 'open', project_id: 'prj_2e2afb329d16ec4b' },
    { id: 'ot4', title: 'need tyo finish branding', project_name: 'test', status: 'in_progress', project_id: 'prj_2e2afb329d16ec4b' },
    { id: 'ot5', title: 'complete barn design', project_name: 'brand launch', status: 'in_progress', project_id: 'prj_2dc1a5bcddbd4de9' },
    { id: 'ot6', title: 'Color grade 30-second cut', project_name: 'Horizon Apparel', status: 'in_progress', project_id: 'prj_horizon' },
  ],
  workloadStats: [
    { userId: 'u1', name: 'Harikeshav M.', role: 'owner', taskCount: 8, relativeOverload: 80, activeProjects: ['test', 'brand launch', 'Kallisto'] },
    { userId: 'u2', name: 'Sheeshram B.', role: 'member', taskCount: 6, relativeOverload: 60, activeProjects: ['Kallisto', 'Horizon'] },
    { userId: 'u3', name: 'Marcus Chen', role: 'member', taskCount: 5, relativeOverload: 50, activeProjects: ['Horizon Lookbook'] },
    { userId: 'u4', name: 'Alex Johnson', role: 'member', taskCount: 4, relativeOverload: 40, activeProjects: ['test'] },
    { userId: 'u5', name: 'Legit Collaborator', role: 'team_member', taskCount: 3, relativeOverload: 30, activeProjects: ['brand launch'] },
    { userId: 'u6', name: 'Lead Architect', role: 'owner', taskCount: 3, relativeOverload: 30, activeProjects: ['test'] },
    { userId: 'u7', name: 'Design Lead', role: 'lead', taskCount: 2, relativeOverload: 20, activeProjects: ['Kallisto'] },
    { userId: 'u8', name: 'Motion Specialist', role: 'member', taskCount: 2, relativeOverload: 20, activeProjects: ['Horizon'] },
    { userId: 'u9', name: 'Production Artist', role: 'member', taskCount: 1, relativeOverload: 10, activeProjects: ['brand launch'] },
    { userId: 'u10', name: 'QA Engineer', role: 'member', taskCount: 1, relativeOverload: 10, activeProjects: ['test'] },
  ],
  pendingApprovals: [],
  scheduledTasks: [],
  activity: [] as AuditLog[],
  greeting: 'Good morning',
};

export function DashboardStaticClient() {
  const [data, setData] = useState(STATIC_DASHBOARD_DATA);

  // If a live backend API is available, refresh with real data smoothly
  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((profileRes) => {
        if (profileRes?.data) {
          setData((prev) => ({
            ...prev,
            user: { ...prev.user, ...profileRes.data },
          }));
        }
      })
      .catch(() => {});

    fetch('/api/projects')
      .then((r) => (r.ok ? r.json() : null))
      .then((projectsRes) => {
        if (projectsRes?.data && Array.isArray(projectsRes.data) && projectsRes.data.length > 0) {
          setData((prev) => ({
            ...prev,
            projects: projectsRes.data,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono text-xs">Loading Specter OS...</div>}>
      <DashboardContent
        user={data.user}
        projects={data.projects}
        activity={data.activity}
        greeting={data.greeting}
        pendingApprovals={data.pendingApprovals}
        scheduledTasks={data.scheduledTasks}
        openTodos={data.openTodos}
        pipelineTodos={data.pipelineTodos}
        workloadStats={data.workloadStats}
      />
    </Suspense>
  );
}
