import { getCurrentUser } from '@/lib/auth/local';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { User } from '@/types';

export const DEFAULT_DEMO_USER: User = {
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
};

export async function getServerUser(): Promise<User | null> {
  try {
    // 1. First check local SQLite database session
    const localUser = await getCurrentUser();
    if (localUser) return localUser;

    // 2. If Supabase is configured, check Supabase session
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) return profile as User;
      }
    }

    // 3. No active session found
    return null;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
