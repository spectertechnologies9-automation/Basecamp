import fs from 'fs';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

let dbInstance: Database | null = null;
let lastLoadedMtime: number = 0;
let initPromise: Promise<Database> | null = null;

const isVercel = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'nexaflow.sqlite');

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  avatar_url TEXT,
  is_active INTEGER DEFAULT 1,
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL,
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#39C6AE',
  status TEXT DEFAULT 'active',
  visibility TEXT DEFAULT 'organization',
  category TEXT DEFAULT 'general',
  client_name TEXT,
  due_date TEXT,
  start_date TEXT,
  end_date TEXT,
  settings TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS todo_lists (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  todo_list_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assignee_ids TEXT,
  assignee_id TEXT,
  pipeline_stage TEXT DEFAULT 'concepts-approval',
  votes TEXT DEFAULT '[]',
  vote_count INTEGER DEFAULT 0,
  requested_status TEXT,
  due_date TEXT,
  start_date TEXT,
  position INTEGER DEFAULT 0,
  completed_at TEXT,
  completed_by TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  todo_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_channels (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'campfire',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS message_posts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id TEXT NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS design_tokens (
  organization_id TEXT PRIMARY KEY,
  tokens TEXT NOT NULL,
  is_published INTEGER DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  project_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  is_all_day INTEGER DEFAULT 0,
  participant_ids TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS personal_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id TEXT NOT NULL,
  is_published INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  question TEXT NOT NULL,
  schedule TEXT,
  participant_ids TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS check_in_responses (
  id TEXT PRIMARY KEY,
  check_in_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  column_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  color TEXT,
  labels TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  config TEXT,
  last_synced_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_automations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_body TEXT NOT NULL,
  target_audience TEXT DEFAULT 'all_members',
  is_active INTEGER DEFAULT 1,
  last_triggered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_modules (
  organization_id TEXT PRIMARY KEY,
  modules TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  automation_id TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'delivered',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  user_id TEXT NOT NULL,
  phone_number TEXT,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'delivered',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS time_entries (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  project_id TEXT,
  user_id TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS file_approvals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  pipeline_stage TEXT DEFAULT 'concepts-approval',
  status TEXT DEFAULT 'pending',
  content_type TEXT,
  feedback TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  platform TEXT DEFAULT 'instagram',
  pipeline_stage TEXT DEFAULT 'scripting',
  status TEXT DEFAULT 'draft',
  scheduled_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'team_member',
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS project_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT,
  category TEXT DEFAULT 'doc',
  uploaded_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_approvals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  stage TEXT DEFAULT 'concept',
  submitted_by TEXT NOT NULL,
  reviewed_by TEXT,
  feedback TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_announcements (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT,
  category TEXT DEFAULT 'general',
  is_pinned INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_announcement_comments (
  id TEXT PRIMARY KEY,
  announcement_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_brand_data (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  module TEXT NOT NULL,
  data TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_fonts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  font_family TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS improvement_tasks (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL DEFAULT 'org_default',
  assigned_to TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'skill',
  points_reward INTEGER DEFAULT 50,
  status TEXT DEFAULT 'assigned',
  submission_notes TEXT,
  submission_url TEXT,
  submitted_at TEXT,
  points_awarded INTEGER DEFAULT 0,
  admin_feedback TEXT,
  awarded_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

`;

export async function getDb(): Promise<Database> {
  if (fs.existsSync(DB_FILE)) {
    try {
      const mtime = fs.statSync(DB_FILE).mtimeMs;
      if (dbInstance && mtime <= lastLoadedMtime) {
        return dbInstance;
      }
      if (dbInstance && mtime > lastLoadedMtime) {
        dbInstance = null;
        initPromise = null;
      }
    } catch {}
  } else if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!fs.existsSync(DB_DIR)) {
      try {
        fs.mkdirSync(DB_DIR, { recursive: true });
      } catch {}
    }

    if (isVercel && !fs.existsSync(DB_FILE)) {
      const seedFile = path.join(process.cwd(), 'data', 'nexaflow.sqlite');
      if (fs.existsSync(seedFile)) {
        try {
          fs.copyFileSync(seedFile, DB_FILE);
        } catch {}
      }
    }

    const getInitSql = async () => {
      if (typeof initSqlJs === 'function') return initSqlJs;
      if ((initSqlJs as any)?.default && typeof (initSqlJs as any).default === 'function') {
        return (initSqlJs as any).default;
      }
      try {
        const req = eval('require');
        const mod = req('sql.js');
        return typeof mod === 'function' ? mod : mod.default;
      } catch {
        return initSqlJs;
      }
    };

    const init = await getInitSql();
    const SQL = await init();
    let db: Database;

    if (fs.existsSync(DB_FILE)) {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      try {
        lastLoadedMtime = fs.statSync(DB_FILE).mtimeMs;
      } catch {}
    } else {
      db = new SQL.Database();
      db.run(SCHEMA_SQL);
      saveDb(db);
    }

    // Always ensure schema tables are defined
    db.run(SCHEMA_SQL);
    saveDb(db);

    // Robust Column Migration Helper
    const ensureColumn = (table: string, column: string, colDef: string) => {
      try {
        const info = db.exec(`PRAGMA table_info(${table})`);
        const existingCols = info.length && info[0].values ? info[0].values.map((v: any) => v[1]) : [];
        if (!existingCols.includes(column)) {
          db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}`);
          saveDb(db);
        }
      } catch (colErr) {
        // Fallback direct run
        try {
          db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}`);
          saveDb(db);
        } catch {}
      }
    };

    // Ensure all critical columns exist across database upgrades
    ensureColumn('whatsapp_messages', 'organization_id', 'TEXT');
    ensureColumn('todos', 'pipeline_stage', "TEXT DEFAULT 'concepts-approval'");
    ensureColumn('todos', 'votes', "TEXT DEFAULT '[]'");
    ensureColumn('todos', 'vote_count', 'INTEGER DEFAULT 0');
    ensureColumn('todos', 'requested_status', 'TEXT');
    ensureColumn('todos', 'assignee_id', 'TEXT');
    ensureColumn('projects', 'category', "TEXT DEFAULT 'general'");
    ensureColumn('projects', 'client_name', 'TEXT');
    ensureColumn('projects', 'due_date', 'TEXT');
    ensureColumn('users', 'bio', 'TEXT');
    ensureColumn('users', 'display_name', 'TEXT');
    ensureColumn('project_files', 'storage_provider', "TEXT DEFAULT 'local'");
    ensureColumn('project_files', 'storage_key', 'TEXT');

    // Migration: ensure notifications table exists
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT,
          action_url TEXT,
          actor_id TEXT,
          project_id TEXT,
          is_read INTEGER DEFAULT 0,
          read_at TEXT,
          created_at TEXT NOT NULL
        )
      `);
      saveDb(db);
    } catch {}

    // Migration: ensure new tables exist
    try {
      db.run(`
        CREATE TABLE IF NOT EXISTS project_files (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER DEFAULT 0,
          mime_type TEXT,
          category TEXT DEFAULT 'doc',
          uploaded_by TEXT,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS project_approvals (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          file_url TEXT,
          status TEXT DEFAULT 'pending',
          stage TEXT DEFAULT 'concept',
          submitted_by TEXT NOT NULL,
          reviewed_by TEXT,
          feedback TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS project_announcements (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          author_id TEXT NOT NULL,
          author_name TEXT,
          category TEXT DEFAULT 'general',
          is_pinned INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS project_announcement_comments (
          id TEXT PRIMARY KEY,
          announcement_id TEXT NOT NULL,
          author_id TEXT NOT NULL,
          author_name TEXT,
          body TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS project_brand_data (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          module TEXT NOT NULL,
          data TEXT NOT NULL,
          created_by TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS custom_fonts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          font_family TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
      saveDb(db);
    } catch (err) {
      console.warn('[DB Migration] Table creation notice:', err);
    }

    // Ensure default organization exists
    const orgCheck = db.exec("SELECT id FROM organizations WHERE id = 'org_default'");
    if (!orgCheck.length || !orgCheck[0].values.length) {
      db.run(
        "INSERT INTO organizations (id, name, slug, timezone, created_at) VALUES (?, ?, ?, ?, ?)",
        ['org_default', 'SPECTER OS', 'specter-os', 'Asia/Kolkata', new Date().toISOString()]
      );
      saveDb(db);
    }

    // Ensure default standard role users exist in clean database
    try {
      const userCount = db.exec("SELECT count(*) FROM users");
      const count = userCount[0]?.values[0]?.[0] as number;
      if (!count || count === 0) {
        const now = new Date().toISOString();
        const defaultHash = '836f261323a28ad1:4b5b7582c61e06fa99e5a1b32d2df9ad797d81a986c757c29e2f47c3e3871987556950ee0b938f325609ffb737fe7847c0a6bbfd0c3be699d799f018eec3d758';
        db.run(
          `INSERT OR REPLACE INTO users (id, organization_id, email, password_hash, full_name, role, timezone, is_active, created_at, updated_at)
           VALUES 
           ('usr_superadmin', 'org_default', 'superadmin@specteros.agency', ?, 'Super Administrator', 'super_admin', 'Asia/Kolkata', 1, ?, ?),
           ('usr_admin', 'org_default', 'admin@specteros.agency', ?, 'Workspace Administrator', 'admin', 'Asia/Kolkata', 1, ?, ?),
           ('usr_member', 'org_default', 'member@specteros.agency', ?, 'Alex Rivera', 'member', 'Asia/Kolkata', 1, ?, ?),
           ('usr_client', 'org_default', 'client@specteros.agency', ?, 'Elena Rostova', 'client', 'Asia/Kolkata', 1, ?, ?)`,
          [defaultHash, now, now, defaultHash, now, now, defaultHash, now, now, defaultHash, now, now]
        );
        db.run(
          `INSERT OR REPLACE INTO organization_members (id, organization_id, user_id, role, created_at)
           VALUES 
           ('mem_superadmin', 'org_default', 'usr_superadmin', 'super_admin', ?),
           ('mem_admin', 'org_default', 'usr_admin', 'admin', ?),
           ('mem_member', 'org_default', 'usr_member', 'member', ?),
           ('mem_client', 'org_default', 'usr_client', 'client', ?)`,
          [now, now, now, now]
        );
        saveDb(db);
      }
    } catch {}

    dbInstance = db;
    saveDbSync(db);
    return db;
  })();

  return initPromise;
}

let saveTimer: NodeJS.Timeout | null = null;

export function saveDb(db: Database = dbInstance!): void {
  if (!db) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      if (!dbInstance) return;
      const data = dbInstance.export();
      const buffer = Buffer.from(data);
      if (typeof fs.writeFile === 'function') {
        fs.writeFile(DB_FILE, buffer, (err) => {
          if (err) console.warn('[SPECTER OS DB] Storage write notice (read-only edge environment):', err?.message);
          else {
            try {
              lastLoadedMtime = fs.statSync(DB_FILE).mtimeMs;
            } catch {}
          }
        });
      }
    } catch (err: any) {
      console.warn('[SPECTER OS DB] Edge environment noticed:', err?.message);
    }
  }, 60);
}

export function saveDbSync(db: Database = dbInstance!): void {
  if (!db) return;
  if (saveTimer) clearTimeout(saveTimer);
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    if (typeof fs.writeFileSync === 'function') {
      fs.writeFileSync(DB_FILE, buffer);
      try {
        lastLoadedMtime = fs.statSync(DB_FILE).mtimeMs;
      } catch {}
    }
  } catch (err: any) {
    console.warn('[SPECTER OS DB] Edge environment noticed (sync):', err?.message);
  }
}

export async function query<T = any>(sqlStr: string, params: any[] = []): Promise<T[]> {
  try {
    const db = await getDb();
    const stmt = db.prepare(sqlStr);
    if (params && params.length) {
      stmt.bind(params);
    }
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  } catch (err) {
    console.warn('[DB Query Error]:', err);
    return [];
  }
}

export async function queryOne<T = any>(sqlStr: string, params: any[] = []): Promise<T | null> {
  try {
    const rows = await query<T>(sqlStr, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.warn('[DB QueryOne Error]:', err);
    return null;
  }
}

export async function execute(sqlStr: string, params: any[] = []): Promise<void> {
  try {
    const db = await getDb();
    db.run(sqlStr, params);
    saveDb(db);
    saveDbSync(db);
  } catch (err) {
    console.warn('[DB Execute Error]:', err);
  }
}
