import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { getServerUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { canManageOrganization } from '@/lib/permissions';
import type { UserRole } from '@/types';
import { AdminView } from '@/components/admin/admin-view';

import { hasAdminAccess } from '@/lib/auth/admin';

export const metadata: Metadata = { title: 'Website Administration & Control Center' };

export default async function AdminPage() {
  const isAdmin = await hasAdminAccess();
  let user: any = await getServerUser();

  if (!isAdmin && !user) redirect('/admin/login');
  if (!isAdmin && !canManageOrganization(user?.role as UserRole)) {
    redirect('/dashboard');
  }

  if (!user) {
    user = (await queryOne<any>('SELECT * FROM users WHERE role IN ("owner", "admin") ORDER BY created_at ASC LIMIT 1')) || {
      id: 'usr_admin',
      full_name: 'Administrator',
      email: 'admin@nexaflow.local',
      role: 'owner',
      organization_id: 'org_default',
    };
  }

  const orgId = user.organization_id || 'org_default';

  // Organization settings
  const org = (await queryOne<any>('SELECT * FROM organizations WHERE id = ?', [orgId])) || {
    id: 'org_default',
    name: 'NexaFlow Systems',
    timezone: 'Asia/Kolkata',
    slug: 'nexaflow-systems',
  };

  // User roster
  const users = await query<any>(
    'SELECT id, full_name, email, role, timezone, is_active, created_at, updated_at FROM users ORDER BY created_at ASC'
  );

  // Projects
  const projects = await query<any>(
    'SELECT id, name, status, color, created_at FROM projects ORDER BY created_at DESC'
  );

  // Total tasks
  const tasksCountRow = await queryOne<{ count: number }>('SELECT count(*) as count FROM todos');
  const tasksCount = tasksCountRow?.count ?? 0;

  // Platform modules
  const moduleRow = await queryOne<any>(
    'SELECT modules FROM platform_modules WHERE organization_id = ?',
    [orgId]
  );
  let modulesMap: Record<string, boolean> = {};
  if (moduleRow?.modules) {
    try {
      modulesMap = JSON.parse(moduleRow.modules);
    } catch {}
  }

  // Integrations
  const integrations = await query<any>(
    'SELECT * FROM integrations WHERE organization_id = ?',
    [orgId]
  );

  // Audit logs
  const auditLogs = await query<any>(
    `SELECT a.*, u.full_name as actor_name, u.email as actor_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC
     LIMIT 50`
  );

  // Time entries
  const timeEntries = await query<any>(
    `SELECT t.*, u.full_name as user_name, p.name as project_name
     FROM time_entries t
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN projects p ON p.id = t.project_id
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT 50`
  );

  // Check SQLite file info
  let dbSizeBytes = 0;
  const dbPath = path.join(process.cwd(), 'data', 'nexaflow.sqlite');
  if (fs.existsSync(dbPath)) {
    try {
      dbSizeBytes = fs.statSync(dbPath).size;
    } catch {}
  }

  const systemStats = {
    usersCount: users.length,
    projectsCount: projects.length,
    tasksCount,
    auditLogsCount: auditLogs.length,
    dbSizeBytes,
    nodeEnv: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  };

  return (
    <AdminView
      currentUser={user}
      organization={org}
      users={users}
      projects={projects}
      systemStats={systemStats}
      integrations={integrations}
      modulesMap={modulesMap}
      auditLogs={auditLogs}
      timeEntries={timeEntries}
    />
  );
}
