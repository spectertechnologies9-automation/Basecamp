import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';
import { CreateProjectForm } from '@/components/projects/create-project-form';

export const metadata: Metadata = { title: 'New Project' };

export default async function NewProjectPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');

  const canCreate =
    (user.role as string) === 'super_admin' ||
    user.role === 'project_manager' ||
    (user.role as string) === 'owner' ||
    (user.role as string) === 'admin' ||
    (user.role as string) === 'brand_manager' ||
    (user.role as string) === 'lead';
  if (!canCreate) {
    redirect('/projects');
  }

  return (
    <div className="min-h-full" style={{ background: 'var(--nf-bg)' }}>
      <CreateProjectForm userId={user.id} />
    </div>
  );
}
