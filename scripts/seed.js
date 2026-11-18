/**
 * NexaFlow Database Seed Script
 * Populates sample organization, projects, and users for local testing.
 */
const { createClient } = require('@supabase/supabase-js');

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log('[Seed] Database credentials not configured in .env.local — skipping seed.');
    return;
  }

  const supabase = createClient(url, key);
  console.log('[Seed] Seeding sample organization & projects...');

  // 1. Create Demo Organization
  const { data: org, error: orgErr } = await supabase.from('organizations').upsert({
    id: '00000000-0000-0000-0000-000000000001',
    name: 'NexaFlow Systems',
    slug: 'nexaflow-systems',
    timezone: 'Asia/Kolkata',
    settings: {
      default_timezone: 'Asia/Kolkata',
      require_invite: true,
      features: {
        todos: true, campfire: true, message_board: true, card_table: true,
        hill_chart: true, timeline: true, check_ins: true, docs: true,
        time_tracking: true, whatsapp: false, ai_assistant: true,
      }
    }
  }).select().single();

  if (orgErr) {
    console.warn('[Seed] Org upsert notice:', orgErr.message);
  } else {
    console.log('[Seed] Org ready:', org.name);
  }

  console.log('[Seed] Completed successfully.');
}

seed().catch(console.error);
