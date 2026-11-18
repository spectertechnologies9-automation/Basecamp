import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';

export default async function TeamPage() {
  const user = await getServerUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'admin' && user.role !== 'owner') {
    redirect('/dashboard');
  }
  redirect('/dashboard?tab=team');
}
