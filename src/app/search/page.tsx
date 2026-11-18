import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { AppHeader } from '@/components/layout/app-header';
import { PersonalToolbar } from '@/components/layout/personal-toolbar';
import { NotificationPanel } from '@/components/layout/notification-panel';
import { GlobalNav } from '@/components/layout/global-nav';
import { SearchView } from '@/components/search/search-view';

export const metadata: Metadata = { title: 'Search' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const isAdmin = user.role === 'admin' || user.role === 'owner';
  const q = searchParams.q?.trim() ?? '';

  let projects: any[] = [];
  let todos: any[] = [];
  let announcements: any[] = [];
  let files: any[] = [];
  let members: any[] = [];

  if (q) {
    const likeQ = `%${q}%`;

    // 0. Team Members
    members = await query<any>(
      'SELECT id, full_name, email, role, avatar_url, bio FROM users WHERE (full_name LIKE ? OR email LIKE ?) AND is_active = 1 LIMIT 8',
      [likeQ, likeQ]
    );

    // 1. Projects
    projects = isAdmin
      ? await query<any>(
          'SELECT id, name, description, color FROM projects WHERE name LIKE ? OR description LIKE ? LIMIT 10',
          [likeQ, likeQ]
        )
      : await query<any>(
          `SELECT DISTINCT p.id, p.name, p.description, p.color
           FROM projects p
           LEFT JOIN project_members pm ON pm.project_id = p.id
           WHERE (pm.user_id = ? OR p.owner_id = ?)
             AND (p.name LIKE ? OR p.description LIKE ?)
           LIMIT 10`,
          [user.id, user.id, likeQ, likeQ]
        );

    // 2. Tasks
    const tRows = isAdmin
      ? await query<any>(
          `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.id as project_id, p.name as project_name, p.color as project_color
           FROM todos t
           JOIN projects p ON p.id = t.project_id
           WHERE t.title LIKE ? OR t.description LIKE ?
           LIMIT 20`,
          [likeQ, likeQ]
        )
      : await query<any>(
          `SELECT t.id, t.title, t.status, t.priority, t.due_date, p.id as project_id, p.name as project_name, p.color as project_color
           FROM todos t
           JOIN projects p ON p.id = t.project_id
           LEFT JOIN project_members pm ON pm.project_id = p.id
           WHERE (pm.user_id = ? OR t.created_by = ?)
             AND (t.title LIKE ? OR t.description LIKE ?)
           LIMIT 20`,
          [user.id, user.id, likeQ, likeQ]
        );

    todos = tRows.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      project: {
        id: t.project_id,
        name: t.project_name,
        color: t.project_color,
      },
    }));

    // 3. Announcements
    announcements = isAdmin
      ? await query<any>(
          `SELECT a.id, a.title, a.body, a.category, a.project_id, p.name as project_name
           FROM project_announcements a
           JOIN projects p ON p.id = a.project_id
           WHERE a.title LIKE ? OR a.body LIKE ?
           LIMIT 10`,
          [likeQ, likeQ]
        )
      : await query<any>(
          `SELECT a.id, a.title, a.body, a.category, a.project_id, p.name as project_name
           FROM project_announcements a
           JOIN projects p ON p.id = a.project_id
           LEFT JOIN project_members pm ON pm.project_id = p.id
           WHERE (pm.user_id = ? OR a.author_id = ?)
             AND (a.title LIKE ? OR a.body LIKE ?)
           LIMIT 10`,
          [user.id, user.id, likeQ, likeQ]
        );

    // 4. Docs & Files
    files = isAdmin
      ? await query<any>(
          `SELECT f.id, f.name, f.file_path, f.category, f.project_id, p.name as project_name
           FROM project_files f
           JOIN projects p ON p.id = f.project_id
           WHERE f.name LIKE ?
           LIMIT 10`,
          [likeQ]
        )
      : await query<any>(
          `SELECT f.id, f.name, f.file_path, f.category, f.project_id, p.name as project_name
           FROM project_files f
           JOIN projects p ON p.id = f.project_id
           LEFT JOIN project_members pm ON pm.project_id = p.id
           WHERE (pm.user_id = ? OR f.uploaded_by = ?)
             AND f.name LIKE ?
           LIMIT 10`,
          [user.id, user.id, likeQ]
        );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--nf-bg)' }}>
      <GlobalNav />
      <NotificationPanel />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader />
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 overflow-y-auto">
            <SearchView
              initialQuery={q}
              projects={projects}
              todos={todos}
              announcements={announcements}
              files={files}
              members={members}
            />
          </main>
        </div>
        <PersonalToolbar />
      </div>
    </div>
  );
}
