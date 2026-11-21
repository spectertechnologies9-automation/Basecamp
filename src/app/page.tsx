import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/auth';

export default async function RootPage() {
  const user = await getServerUser();
  if (!user) {
    redirect('/auth/login');
  }
  redirect('/dashboard');
}
