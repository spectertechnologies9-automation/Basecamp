export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (!url.startsWith('https://')) return false;
  if (url.includes('your-project') || url.includes('placeholder')) return false;
  if (key.includes('your-anon-key') || key.includes('placeholder')) return false;
  return true;
}

export const FALLBACK_SUPABASE_URL = 'https://placeholder-project.supabase.co';
export const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.demo_signature_for_development_mode_only_replace_in_env_local';
