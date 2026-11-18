/**
 * NexaFlow Migration Runner
 * Executes supabase/migrations/ in sequential order against the database.
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log('[Migrations] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
    console.log('[Migrations] Set credentials in .env.local before running db:migrate.');
    process.exit(0);
  }

  const supabase = createClient(url, key);
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  console.log(`[Migrations] Found ${files.length} migration file(s).`);
  for (const file of files) {
    console.log(`[Migrations] Applying: ${file}...`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.warn(`[Migrations] Notice on ${file}:`, error.message);
    } else {
      console.log(`[Migrations] Applied: ${file}`);
    }
  }
  console.log('[Migrations] Done.');
}

run().catch(console.error);
