const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'nexaflow.sqlite');

async function fix() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_FILE);
  const db = new SQL.Database(fileBuffer);

  const getCols = (table) => {
    const res = db.exec(`PRAGMA table_info(${table})`);
    if (!res.length || !res[0].values) return [];
    return res[0].values.map((v) => v[1]);
  };

  console.log('Current todos columns:', getCols('todos'));

  const addCol = (table, colDef) => {
    const colName = colDef.split(' ')[0];
    const existing = getCols(table);
    if (!existing.includes(colName)) {
      console.log(`Adding ${colName} to ${table}...`);
      db.run(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
    } else {
      console.log(`${table}.${colName} already exists.`);
    }
  };

  // todos table
  addCol('todos', 'requested_status TEXT');
  addCol('todos', 'votes TEXT DEFAULT \'[]\'');
  addCol('todos', 'vote_count INTEGER DEFAULT 0');
  addCol('todos', 'pipeline_stage TEXT DEFAULT \'concepts-approval\'');
  addCol('todos', 'assignee_id TEXT');

  // users table
  addCol('users', 'bio TEXT');
  addCol('users', 'display_name TEXT');

  // projects table
  addCol('projects', 'category TEXT DEFAULT \'general\'');
  addCol('projects', 'client_name TEXT');
  addCol('projects', 'due_date TEXT');

  // whatsapp_messages table
  addCol('whatsapp_messages', 'organization_id TEXT');

  // notifications table
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

  console.log('Updated todos columns:', getCols('todos'));

  const data = db.export();
  fs.writeFileSync(DB_FILE, Buffer.from(data));
  console.log('Database successfully updated and saved to disk.');
}

fix().catch(console.error);
