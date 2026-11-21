'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardContent } from './dashboard-content';
import type { User, Project, AuditLog } from '@/types';

export const STATIC_DASHBOARD_DATA = {
  user: null as unknown as User,
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
  const router = useRouter();
  const [data, setData] = useState(() => {
    let initialUser: any = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('specter_user');
        if (stored) {
          const u = JSON.parse(stored);
          if (u && (u.id || u.email)) initialUser = u;
        }
      } catch {}
    }
    return {
      ...STATIC_DASHBOARD_DATA,
      user: initialUser,
    };
  });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let resolvedUser = data.user;

    // 1. Check localStorage first
    try {
      const stored = localStorage.getItem('specter_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && (u.id || u.email)) {
          resolvedUser = u;
          setData((prev) => ({ ...prev, user: u }));
        }
      }
    } catch {}

    // 2. Fetch authenticated profile from API
    fetch('/api/user/profile')
      .then((r) => {
        if (r.status === 401) {
          if (!resolvedUser) {
            router.push('/auth/login');
          }
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((profileRes) => {
        if (profileRes?.data && profileRes.data.id) {
          resolvedUser = profileRes.data;
          setData((prev) => ({
            ...prev,
            user: { ...(prev.user || {}), ...profileRes.data },
          }));
        } else if (!resolvedUser) {
          router.push('/auth/login');
        }
      })
      .catch(() => {
        if (!resolvedUser) {
          router.push('/auth/login');
        }
      })
      .finally(() => {
        setAuthChecked(true);
      });

    // 3. Load projects & members
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
  }, [router]);

  if (!data.user && !authChecked) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 font-mono text-xs gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-bold flex items-center justify-center text-sm animate-pulse">
          S
        </div>
        <span>Authenticating session…</span>
      </div>
    );
  }

  if (!data.user && authChecked) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 font-mono text-xs">
          Loading Specter OS...
        </div>
      }
    >
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
