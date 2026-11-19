'use client';

import { useState, useEffect, Suspense } from 'react';
import { DashboardContent } from './dashboard-content';
import type { User, Project, AuditLog } from '@/types';

export const STATIC_DASHBOARD_DATA = {
  user: {
    id: 'usr_admin',
    organization_id: 'org_default',
    email: 'admin@specteros.agency',
    full_name: 'Workspace Administrator',
    role: 'admin',
    timezone: 'Asia/Kolkata',
    locale: 'en',
    is_active: true,
    created_at: '2026-10-22T10:00:00Z',
    updated_at: '2026-11-20T00:00:00Z',
  } as User,
  projects: [] as unknown as Project[],
  members: [] as any[],
  pipelineTodos: [],
  openTodos: [],
  workloadStats: [],
  pendingApprovals: [],
  scheduledTasks: [],
  activity: [] as AuditLog[],
  greeting: 'Good morning',
};

export function DashboardStaticClient() {
  const [data, setData] = useState(STATIC_DASHBOARD_DATA);

  // If a live backend API is available, refresh with real data smoothly
  useEffect(() => {
    // Check localStorage for logged in user first
    try {
      const stored = localStorage.getItem('specter_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.id) {
          setData((prev) => ({ ...prev, user: u }));
        }
      }
    } catch {}

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
        if (projectsRes?.data && Array.isArray(projectsRes.data)) {
          setData((prev) => ({
            ...prev,
            projects: projectsRes.data,
          }));
        }
      })
      .catch(() => {});

    fetch('/api/team/members')
      .then((r) => (r.ok ? r.json() : null))
      .then((membersRes) => {
        if (membersRes?.data && Array.isArray(membersRes.data)) {
          setData((prev) => ({
            ...prev,
            members: membersRes.data,
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
        members={data.members}
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
