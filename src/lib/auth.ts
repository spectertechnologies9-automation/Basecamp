import { getCurrentUser } from '@/lib/auth/local';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { User } from '@/types';

export async function getServerUser(): Promise<User | null> {
  try {
    // 1. First check local SQLite database session
    const localUser = await getCurrentUser();
    if (localUser) return localUser;

    // 2. If Supabase is configured, check Supabase session
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile as User | null;
    }

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
