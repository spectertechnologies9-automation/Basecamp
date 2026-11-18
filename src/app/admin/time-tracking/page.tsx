import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import { Clock, Plus, User, CheckCircle2, Calendar } from 'lucide-react';
import { AdminTimeTrackingView } from '@/components/admin/admin-time-tracking-view';

import { hasAdminAccess } from '@/lib/auth/admin';

export const metadata: Metadata = { title: 'Time Tracking & Timesheets' };

export default async function AdminTimeTrackingPage() {
  const isAdmin = await hasAdminAccess();
  let user: any = await getServerUser();
  if (!isAdmin && !user) redirect('/admin/login');

  if (!user) {
    user = (await queryOne<any>('SELECT * FROM users WHERE role IN ("owner", "admin") ORDER BY created_at ASC LIMIT 1')) || {
      id: 'usr_admin',
      full_name: 'Administrator',
      email: 'admin@nexaflow.local',
      role: 'owner',
      organization_id: 'org_default',
    };
  }

  await execute(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      project_id TEXT,
      user_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      notes TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  const entries = await query<any>(
    `SELECT t.*, u.full_name as user_name, p.name as project_name, p.color as project_color
     FROM time_entries t
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN projects p ON p.id = t.project_id
     ORDER BY t.date DESC
     LIMIT 100`
  );

  const projects = await query<any>('SELECT id, name FROM projects ORDER BY name ASC');

  return (
    <div className="max-w-5xl mx-auto p-6 w-full">
      <AdminTimeTrackingView initialEntries={entries} projects={projects} currentUserId={user.id} />
    </div>
  );
}
