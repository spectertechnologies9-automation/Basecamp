const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '..', 'data', 'nexaflow.sqlite');
  
  let db;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Wipe projects, todos, comments, files, approvals, announcements, audit_logs
  db.run('DELETE FROM projects');
  db.run('DELETE FROM project_members');
  db.run('DELETE FROM todos');
  db.run('DELETE FROM todo_lists');
  db.run('DELETE FROM comments');
  db.run('DELETE FROM cards');
  db.run('DELETE FROM check_ins');
  db.run('DELETE FROM check_in_responses');
  db.run('DELETE FROM project_files');
  db.run('DELETE FROM project_approvals');
  db.run('DELETE FROM project_announcements');
  db.run('DELETE FROM project_announcement_comments');
  db.run('DELETE FROM project_brand_data');
  db.run('DELETE FROM calendar_events');
  db.run('DELETE FROM audit_logs');
  db.run('DELETE FROM users');
  db.run('DELETE FROM organization_members');

  const now = new Date().toISOString();
  const superHash = hashPassword('SuperAdmin@2026!');
  const adminHash = hashPassword('Admin@2026!');
  const memberHash = hashPassword('Member@2026!');
  const clientHash = hashPassword('Client@2026!');

  // Seed default organization
  db.run('INSERT OR REPLACE INTO organizations (id, name, slug, timezone, created_at) VALUES (?, ?, ?, ?, ?)',
    ['org_default', 'SPECTER OS', 'specter-os', 'Asia/Kolkata', now]);

  // Seed clean role accounts
  db.run(
    `INSERT INTO users (id, organization_id, email, password_hash, full_name, role, timezone, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, 1, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, 1, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      'usr_superadmin', 'org_default', 'superadmin@specteros.agency', superHash, 'Super Administrator', 'super_admin', 'Asia/Kolkata', now, now,
      'usr_admin', 'org_default', 'admin@specteros.agency', adminHash, 'Workspace Administrator', 'admin', 'Asia/Kolkata', now, now,
      'usr_member', 'org_default', 'member@specteros.agency', memberHash, 'Alex Rivera', 'member', 'Asia/Kolkata', now, now,
      'usr_client', 'org_default', 'client@specteros.agency', clientHash, 'Elena Rostova', 'client', 'Asia/Kolkata', now, now,
    ]
  );

  db.run(
    `INSERT INTO organization_members (id, organization_id, user_id, role, created_at)
     VALUES (?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?)`,
    [
      'mem_superadmin', 'org_default', 'usr_superadmin', 'super_admin', now,
      'mem_admin', 'org_default', 'usr_admin', 'admin', now,
      'mem_member', 'org_default', 'usr_member', 'member', now,
      'mem_client', 'org_default', 'usr_client', 'client', now,
    ]
  );

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log('Successfully wiped old projects and initialized clean role database in data/nexaflow.sqlite');
  console.log('Users in DB:', db.exec('SELECT id, email, role FROM users')[0]?.values);
  console.log('Projects in DB count:', db.exec('SELECT count(*) FROM projects')[0]?.values[0][0]);
}

main().catch(console.error);
