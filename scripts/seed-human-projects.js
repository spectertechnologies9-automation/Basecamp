const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function main() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '..', 'data', 'nexaflow.sqlite');
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);

  const now = new Date().toISOString();
  const orgId = 'org_default';

  // 1. Ensure team users have rich, human profiles
  db.run("UPDATE users SET full_name = 'Harikeshav Moorthy', display_name = 'Harikeshav (Owner)' WHERE id = 'usr_836f261323a28ad1'");
  db.run("UPDATE users SET full_name = 'Harikeshav M.', display_name = 'Harikeshav (Lead)' WHERE id = 'usr_57afcc741499c5ba'");
  db.run("UPDATE users SET full_name = 'Sheeshram B.', display_name = 'Sheeshram (Designer)' WHERE id = 'usr_f4dec2cd5b0c7ee1'");

  // Insert two additional realistic collaborators if not present
  db.run(`
    INSERT OR REPLACE INTO users (id, organization_id, email, password_hash, full_name, display_name, role, timezone, is_active, created_at, updated_at)
    VALUES 
      ('usr_marcus_chen', '${orgId}', 'marcus.chen@specteros.local', 'hash_mock', 'Marcus Chen', 'Marcus Chen (3D/Motion)', 'member', 'Asia/Kolkata', 1, '${now}', '${now}'),
      ('usr_david_kallisto', '${orgId}', 'david@kallistoaudio.com', 'hash_mock', 'David K.', 'David K. (Client Partner)', 'client', 'Europe/Oslo', 1, '${now}', '${now}')
  `);

  // Clear any leftover data for these projects
  const projectIds = ['prj_kallisto', 'prj_horizon', 'prj_verve'];
  for (const pid of projectIds) {
    db.run("DELETE FROM projects WHERE id = ?", [pid]);
    db.run("DELETE FROM project_members WHERE project_id = ?", [pid]);
    db.run("DELETE FROM todo_lists WHERE project_id = ?", [pid]);
    db.run("DELETE FROM todos WHERE project_id = ?", [pid]);
    db.run("DELETE FROM comments WHERE todo_id IN (SELECT id FROM todos WHERE project_id = ?)", [pid]);
    db.run("DELETE FROM project_announcements WHERE project_id = ?", [pid]);
    db.run("DELETE FROM project_announcement_comments WHERE announcement_id IN (SELECT id FROM project_announcements WHERE project_id = ?)", [pid]);
    db.run("DELETE FROM project_approvals WHERE project_id = ?", [pid]);
    db.run("DELETE FROM project_files WHERE project_id = ?", [pid]);
    db.run("DELETE FROM project_brand_data WHERE project_id = ?", [pid]);
    db.run("DELETE FROM chat_messages WHERE channel_id IN (SELECT id FROM chat_channels WHERE project_id = ?)", [pid]);
    db.run("DELETE FROM chat_channels WHERE project_id = ?", [pid]);
    db.run("DELETE FROM message_posts WHERE project_id = ?", [pid]);
    db.run("DELETE FROM calendar_events WHERE project_id = ?", [pid]);
    db.run("DELETE FROM notifications WHERE project_id = ?", [pid]);
  }

  // -------------------------------------------------------------
  // PROJECT 1: Kallisto Audio — Flagship Rebrand & Packaging
  // -------------------------------------------------------------
  const prj1 = {
    id: 'prj_kallisto',
    name: 'Kallisto Audio — Flagship Rebrand & Packaging',
    client_name: 'Kallisto Sound Labs',
    category: 'branding',
    color: '#39C6AE',
    status: 'active',
    description: 'End-to-end visual identity overhaul, bespoke typography pairing, sustainable unboxing experience, and foil-stamped retail packaging for the Model-1 audiophile headphones launch.',
    start_date: '2026-10-10',
    end_date: '2026-11-20',
    due_date: '2026-11-20',
  };

  db.run(`
    INSERT INTO projects (id, organization_id, owner_id, name, description, color, status, visibility, start_date, end_date, due_date, settings, created_at, updated_at, category, client_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'organization', ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    prj1.id, orgId, 'usr_836f261323a28ad1', prj1.name, prj1.description, prj1.color, prj1.status,
    prj1.start_date, prj1.end_date, prj1.due_date, JSON.stringify({ tools: { todos: true, campfire: true, message_board: true } }),
    '2026-10-10T09:00:00Z', now, prj1.category, prj1.client_name
  ]);

  // Project 1 Members
  const p1Members = [
    { id: 'pm_k1', user_id: 'usr_836f261323a28ad1', role: 'owner' },
    { id: 'pm_k2', user_id: 'usr_57afcc741499c5ba', role: 'lead' },
    { id: 'pm_k3', user_id: 'usr_f4dec2cd5b0c7ee1', role: 'member' },
    { id: 'pm_k4', user_id: 'usr_marcus_chen', role: 'member' },
    { id: 'pm_k5', user_id: 'usr_david_kallisto', role: 'client' },
  ];
  for (const m of p1Members) {
    db.run("INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)", [m.id, prj1.id, m.user_id, m.role, now]);
  }

  // Project 1 Todo List & Todos
  const list1Id = 'lst_kallisto_main';
  db.run("INSERT INTO todo_lists (id, project_id, name, position, created_by, created_at) VALUES (?, ?, ?, 0, ?, ?)", [list1Id, prj1.id, 'Deliverables & Sprint Tasks', 'usr_836f261323a28ad1', now]);

  const p1Todos = [
    {
      id: 'td_k1',
      title: 'Refine geometric "K" monomark kerning & optical balance',
      desc: 'Ensure consistency at 16px favicon scale up to 400mm billboard lockups. Test contrast against charcoal anodized aluminum surfaces.',
      status: 'completed',
      pipeline_stage: 'concepts-approval',
      priority: 'high',
      assignee_id: 'usr_f4dec2cd5b0c7ee1',
      assignee_ids: JSON.stringify(['usr_f4dec2cd5b0c7ee1']),
      votes: JSON.stringify(['usr_836f261323a28ad1', 'usr_57afcc741499c5ba', 'usr_david_kallisto']),
      vote_count: 3,
      due_date: '2026-10-24',
      completed_at: '2026-10-24T16:30:00Z',
    },
    {
      id: 'td_k2',
      title: 'Press check with Heidelberg print master for spot UV sleeve',
      desc: 'Verify foil registration on 380gsm matte black unbleached pulp box. Inspect blind debossing depth on top lid to prevent paper tearing.',
      status: 'in_progress',
      pipeline_stage: 'creative-review',
      priority: 'urgent',
      assignee_id: 'usr_f4dec2cd5b0c7ee1',
      assignee_ids: JSON.stringify(['usr_f4dec2cd5b0c7ee1']),
      votes: '[]',
      vote_count: 0,
      due_date: '2026-11-04',
      completed_at: null,
    },
    {
      id: 'td_k3',
      title: 'Finalize tactile recycled linen exterior sleeve dimensions',
      desc: 'Collaborate with structural packaging engineer on magnetic closure flap tolerances.',
      status: 'open',
      pipeline_stage: 'scripting',
      priority: 'medium',
      assignee_id: 'usr_57afcc741499c5ba',
      assignee_ids: JSON.stringify(['usr_57afcc741499c5ba']),
      votes: '[]',
      vote_count: 0,
      due_date: '2026-11-08',
      completed_at: null,
    },
    {
      id: 'td_k4',
      title: 'Render 3D exploded assembly animation of headphone ear-cup',
      desc: 'Show acoustic chamber damping layers, custom 50mm beryllium driver, and memory foam lambskin pads in 4K resolution.',
      status: 'open',
      pipeline_stage: 'scripting',
      priority: 'high',
      assignee_id: 'usr_marcus_chen',
      assignee_ids: JSON.stringify(['usr_marcus_chen']),
      votes: '[]',
      vote_count: 0,
      due_date: '2026-11-14',
      completed_at: null,
    },
    {
      id: 'td_k5',
      title: 'Publish Pantone spot color swatches (419C Obsidian & 877C Metallic Silver)',
      desc: 'Calibrate digital swatch exports for Illustrator, Figma, and InDesign print workflows.',
      status: 'completed',
      pipeline_stage: 'concepts-approval',
      priority: 'low',
      assignee_id: 'usr_f4dec2cd5b0c7ee1',
      assignee_ids: JSON.stringify(['usr_f4dec2cd5b0c7ee1']),
      votes: JSON.stringify(['usr_836f261323a28ad1', 'usr_57afcc741499c5ba']),
      vote_count: 2,
      due_date: '2026-10-18',
      completed_at: '2026-10-18T14:10:00Z',
    },
  ];

  for (const t of p1Todos) {
    db.run(`
      INSERT INTO todos (id, todo_list_id, project_id, title, description, status, priority, assignee_id, assignee_ids, pipeline_stage, votes, vote_count, due_date, completed_at, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      t.id, list1Id, prj1.id, t.title, t.desc, t.status, t.priority, t.assignee_id, t.assignee_ids,
      t.pipeline_stage, t.votes, t.vote_count, t.due_date, t.completed_at, 'usr_836f261323a28ad1', now, now
    ]);
  }

  // Project 1 Announcements
  db.run(`
    INSERT INTO project_announcements (id, project_id, title, body, author_id, author_name, category, is_pinned, created_at, updated_at)
    VALUES 
      ('ann_k1', '${prj1.id}', 'Physical packaging proofs arrived from the specialty press! 📦', 'The 380gsm linen textured unbleached stock with blind debossing on the inside lid looks remarkable in person. We scheduled a quick 10-minute team review at 3 PM to inspect the hinge tolerances before authorizing the production run.', 'usr_836f261323a28ad1', 'Harikeshav Moorthy', 'general', 1, '2026-10-27T10:15:00Z', '2026-10-27T10:15:00Z'),
      ('ann_k2', '${prj1.id}', 'Client Leadership Sign-Off on Typography System', 'David and the Kallisto executive board officially approved our Lora + Inter typographic hierarchy for the retail packaging and web presence. All teams can now pull vector assets directly from the Asset Library.', 'usr_57afcc741499c5ba', 'Harikeshav M.', 'branding', 0, '2026-10-26T14:00:00Z', '2026-10-26T14:00:00Z')
  `);

  // Project 1 Campfire Chat
  const ch1Id = 'ch_kallisto_campfire';
  db.run("INSERT INTO chat_channels (id, project_id, name, type, created_at) VALUES (?, ?, 'Campfire', 'campfire', ?)", [ch1Id, prj1.id, now]);
  
  const p1Messages = [
    { author: 'usr_836f261323a28ad1', body: 'Good morning everyone! Just uploaded the final die-line vectors for the Model-1 retail box to Docs & Files.' },
    { author: 'usr_f4dec2cd5b0c7ee1', body: 'Checked the SVG exports — the 0.25pt registration markers are crisp. Preparing the spot UV layer now.' },
    { author: 'usr_marcus_chen', body: 'Working on the 3D lighting pass for the anodized finish. Should have the first turntable preview by tomorrow afternoon.' },
    { author: 'usr_david_kallisto', body: 'Appreciate the quick turnarounds team! The tactile feel on the proof sleeve exceeds our expectations.' },
  ];
  for (let i = 0; i < p1Messages.length; i++) {
    const m = p1Messages[i];
    const mTime = new Date(Date.now() - (p1Messages.length - i) * 3600000).toISOString();
    db.run("INSERT INTO chat_messages (id, channel_id, author_id, body, type, created_at) VALUES (?, ?, ?, ?, 'text', ?)", [`msg_k_${i+1}`, ch1Id, m.author, m.body, mTime]);
  }

  // Project 1 Deliverable Reviews (2-tier system)
  db.run(`
    INSERT INTO project_approvals (id, project_id, title, description, file_url, status, stage, submitted_by, reviewed_by, feedback, created_at, updated_at)
    VALUES 
      ('app_k1', '${prj1.id}', 'Model-1 Retail Packaging Exterior Sleeve (Final AI Vector)', 'Includes spot UV mask, silver metallic foil stamp vector, and UPC barcode placeholder.', 'https://assets.specteros.local/kallisto/Packaging_DieLine_Model1_Final_Vector.ai', 'approved', 'production', 'usr_f4dec2cd5b0c7ee1', 'usr_836f261323a28ad1', 'Flawless line weight and bleed margin calibration. Approved for press.', '2026-10-25T11:00:00Z', '2026-10-25T15:30:00Z'),
      ('app_k2', '${prj1.id}', 'Warranty Booklet & Quick-Start Typography Spec', 'Accordion-fold mini leaflet typography pairing in English, German, and Japanese.', 'https://assets.specteros.local/kallisto/Quick_Start_Guide_Spec_v1.pdf', 'pending_client_review', 'concept', 'usr_f4dec2cd5b0c7ee1', 'usr_57afcc741499c5ba', 'Approved internally by Team Lead. Awaiting final legal disclaimer sign-off from David.', '2026-10-27T16:00:00Z', '2026-10-27T17:15:00Z')
  `);

  // Project 1 Files
  const p1Files = [
    { name: 'Kallisto_Brand_Manual_v2.4.pdf', path: '/uploads/kallisto/Kallisto_Brand_Manual_v2.4.pdf', size: 8847360, mime: 'application/pdf', cat: 'doc' },
    { name: 'Packaging_DieLine_Model1_Final_Vector.ai', path: '/uploads/kallisto/Packaging_DieLine_Model1_Final_Vector.ai', size: 14680064, mime: 'application/illustrator', cat: 'asset' },
    { name: 'Pantone_Color_Swatches_C_Series.ase', path: '/uploads/kallisto/Pantone_Color_Swatches_C_Series.ase', size: 1228800, mime: 'application/octet-stream', cat: 'asset' },
  ];
  for (let i = 0; i < p1Files.length; i++) {
    const f = p1Files[i];
    db.run("INSERT INTO project_files (id, project_id, name, file_path, file_size, mime_type, category, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [`pf_k_${i+1}`, prj1.id, f.name, f.path, f.size, f.mime, f.cat, 'usr_836f261323a28ad1', '2026-10-20T10:00:00Z']
    );
  }

  // Project 1 Calendar Events
  db.run(`
    INSERT INTO calendar_events (id, organization_id, project_id, title, description, start_at, end_at, is_all_day, created_by, created_at)
    VALUES 
      ('ev_k1', '${orgId}', '${prj1.id}', 'Model-1 Press Check at Print Works', 'On-site color balance check with lead press operator', '2026-11-04T10:00:00Z', '2026-11-04T13:00:00Z', 0, 'usr_836f261323a28ad1', '${now}'),
      ('ev_k2', '${orgId}', '${prj1.id}', 'Retail Unboxing Experience Dry Run', 'Physical sample unboxing and un-boxing video walkthrough with client', '2026-11-12T15:00:00Z', '2026-11-12T16:30:00Z', 0, 'usr_57afcc741499c5ba', '${now}')
  `);

  // Project 1 Brand Data (Tokens & Guidelines)
  db.run(`
    INSERT INTO project_brand_data (id, project_id, module, data, created_by, created_at, updated_at)
    VALUES 
      ('bd_k1', '${prj1.id}', 'palette', '${JSON.stringify([
        { name: 'Obsidian Black', hex: '#0D1117', type: 'Primary Base' },
        { name: 'Nordic Teal', hex: '#39C6AE', type: 'Accent Signature' },
        { name: 'Metallic Silver', hex: '#A8B3C0', type: 'Secondary Foil' },
        { name: 'Crisp Off-White', hex: '#F2F6F8', type: 'Typography High-Contrast' }
      ])}', 'usr_836f261323a28ad1', '${now}', '${now}'),
      ('bd_k2', '${prj1.id}', 'typography', '${JSON.stringify([
        { label: 'Display Headings', value: 'Lora Semibold (Serif optical balance)' },
        { label: 'Body Text & Technical Specs', value: 'Inter Variable 400/500' },
        { label: 'Telemetry & Part Serial Numbers', value: 'JetBrains Mono 500' }
      ])}', 'usr_836f261323a28ad1', '${now}', '${now}')
  `);


  // -------------------------------------------------------------
  // PROJECT 2: Horizon Autumn 2026 Editorial & Interactive Lookbook
  // -------------------------------------------------------------
  const prj2 = {
    id: 'prj_horizon',
    name: 'Horizon Autumn 2026 Editorial & Interactive Lookbook',
    client_name: 'Horizon Apparel',
    category: 'marketing',
    color: '#E56B70',
    status: 'active',
    description: 'Creative campaign direction, lookbook editorial layout, 4K film video teaser sound design, and an immersive digital lookbook for the Autumn capsule collection.',
    start_date: '2026-10-15',
    end_date: '2026-11-28',
    due_date: '2026-11-28',
  };

  db.run(`
    INSERT INTO projects (id, organization_id, owner_id, name, description, color, status, visibility, start_date, end_date, due_date, settings, created_at, updated_at, category, client_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'organization', ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    prj2.id, orgId, 'usr_836f261323a28ad1', prj2.name, prj2.description, prj2.color, prj2.status,
    prj2.start_date, prj2.end_date, prj2.due_date, JSON.stringify({ tools: { todos: true, campfire: true, message_board: true } }),
    '2026-10-15T11:00:00Z', now, prj2.category, prj2.client_name
  ]);

  // Project 2 Members
  const p2Members = [
    { id: 'pm_h1', user_id: 'usr_836f261323a28ad1', role: 'owner' },
    { id: 'pm_h2', user_id: 'usr_57afcc741499c5ba', role: 'lead' },
    { id: 'pm_h3', user_id: 'usr_marcus_chen', role: 'member' },
    { id: 'pm_k3_h', user_id: 'usr_f4dec2cd5b0c7ee1', role: 'member' },
  ];
  for (const m of p2Members) {
    db.run("INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)", [m.id, prj2.id, m.user_id, m.role, now]);
  }

  // Project 2 Todos
  const list2Id = 'lst_horizon_main';
  db.run("INSERT INTO todo_lists (id, project_id, name, position, created_by, created_at) VALUES (?, ?, 'Campaign Sprint Items', 0, ?, ?)", [list2Id, prj2.id, 'usr_836f261323a28ad1', now]);

  const p2Todos = [
    {
      id: 'td_h1',
      title: 'Select top 45 hero stills from Iceland black-sand shoot',
      desc: 'Color calibrate RAW stills for both print lookbook spread and Retina display web resolutions.',
      status: 'completed',
      pipeline_stage: 'concepts-approval',
      priority: 'high',
      assignee_id: 'usr_836f261323a28ad1',
      assignee_ids: JSON.stringify(['usr_836f261323a28ad1']),
      votes: JSON.stringify(['usr_836f261323a28ad1', 'usr_57afcc741499c5ba', 'usr_marcus_chen', 'usr_f4dec2cd5b0c7ee1']),
      vote_count: 4,
      due_date: '2026-10-22',
      completed_at: '2026-10-22T19:00:00Z',
    },
    {
      id: 'td_h2',
      title: 'Color grade 30-second campaign cinema cut with 35mm grain',
      desc: 'Emphasize the earthy ochre and deep basalt tones of the outerwear silhouettes.',
      status: 'in_progress',
      pipeline_stage: 'creative-review',
      priority: 'urgent',
      assignee_id: 'usr_marcus_chen',
      assignee_ids: JSON.stringify(['usr_marcus_chen']),
      votes: '[]',
      vote_count: 0,
      due_date: '2026-11-05',
      completed_at: null,
    },
    {
      id: 'td_h3',
      title: 'Implement smooth horizontal parallax carousel for web lookbook',
      desc: 'Ensure touch-swiping on iOS devices delivers responsive momentum scrolling.',
      status: 'open',
      pipeline_stage: 'scripting',
      priority: 'medium',
      assignee_id: 'usr_57afcc741499c5ba',
      assignee_ids: JSON.stringify(['usr_57afcc741499c5ba']),
      votes: '[]',
      vote_count: 0,
      due_date: '2026-11-12',
      completed_at: null,
    },
    {
      id: 'td_h4',
      title: 'Finalize environmental sustainability callout copy',
      desc: 'Format certified organic wool and recycled nylon provenance data in clean editorial typography.',
      status: 'open',
      pipeline_stage: 'scripting',
      priority: 'low',
      assignee_id: 'usr_f4dec2cd5b0c7ee1',
      assignee_ids: JSON.stringify(['usr_f4dec2cd5b0c7ee1']),
      votes: '[]',
      vote_count: 0,
      due_date: '2026-11-10',
      completed_at: null,
    },
  ];

  for (const t of p2Todos) {
    db.run(`
      INSERT INTO todos (id, todo_list_id, project_id, title, description, status, priority, assignee_id, assignee_ids, pipeline_stage, votes, vote_count, due_date, completed_at, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      t.id, list2Id, prj2.id, t.title, t.desc, t.status, t.priority, t.assignee_id, t.assignee_ids,
      t.pipeline_stage, t.votes, t.vote_count, t.due_date, t.completed_at, 'usr_836f261323a28ad1', now, now
    ]);
  }

  // Project 2 Announcements
  db.run(`
    INSERT INTO project_announcements (id, project_id, title, body, author_id, author_name, category, is_pinned, created_at, updated_at)
    VALUES 
      ('ann_h1', '${prj2.id}', 'Iceland Shoot Film Scans Transferred to Cloud Storage 🏔️', 'The high-resolution 35mm scans from the Vik black-sand beach session are synchronized in our media bucket. The natural coastal overcast diffused the lighting beautifully — great work to the field crew!', 'usr_836f261323a28ad1', 'Harikeshav Moorthy', 'general', 1, '2026-10-23T18:00:00Z', '2026-10-23T18:00:00Z')
  `);

  // Project 2 Campfire Chat
  const ch2Id = 'ch_horizon_campfire';
  db.run("INSERT INTO chat_channels (id, project_id, name, type, created_at) VALUES (?, ?, 'Campfire', 'campfire', ?)", [ch2Id, prj2.id, now]);
  
  db.run(`
    INSERT INTO chat_messages (id, channel_id, author_id, body, type, created_at)
    VALUES 
      ('msg_h_1', '${ch2Id}', 'usr_836f261323a28ad1', 'Reviewing the web lookbook typography hierarchy with Horizon today at 4 PM.', 'text', '2026-10-27T08:30:00Z'),
      ('msg_h_2', '${ch2Id}', 'usr_marcus_chen', 'The 4K color pass on shot #14 is rendering now. Basalt blacks and deep ochre tones look very natural.', 'text', '2026-10-27T09:15:00Z')
  `);

  // Project 2 Approvals
  db.run(`
    INSERT INTO project_approvals (id, project_id, title, description, file_url, status, stage, submitted_by, reviewed_by, feedback, created_at, updated_at)
    VALUES 
      ('app_h1', '${prj2.id}', 'Autumn Capsule Lookbook Cover Spread', 'Double-page gatefold cover layout with matte varnish typography treatment.', 'https://assets.specteros.local/horizon/Cover_Spread_v2.pdf', 'approved', 'production', 'usr_836f261323a28ad1', 'usr_57afcc741499c5ba', 'Approved. Superb contrast between the orange sunset jacket and the basalt cliffs.', '2026-10-24T12:00:00Z', '2026-10-24T14:00:00Z')
  `);


  // -------------------------------------------------------------
  // PROJECT 3: Verve OS — Next-Gen Patient Health Design System
  // -------------------------------------------------------------
  const prj3 = {
    id: 'prj_verve',
    name: 'Verve OS — Next-Gen Patient Health Design System',
    client_name: 'Verve BioSystems',
    category: 'general',
    color: '#6366F1',
    status: 'active',
    description: 'Complete multi-platform design token architecture, WCAG AAA accessibility contrast engine, and high-fidelity clinician telemetry dashboards for the Verve mobile and web ecosystem.',
    start_date: '2026-10-01',
    end_date: '2026-12-15',
    due_date: '2026-12-15',
  };

  db.run(`
    INSERT INTO projects (id, organization_id, owner_id, name, description, color, status, visibility, start_date, end_date, due_date, settings, created_at, updated_at, category, client_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'organization', ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    prj3.id, orgId, 'usr_836f261323a28ad1', prj3.name, prj3.description, prj3.color, prj3.status,
    prj3.start_date, prj3.end_date, prj3.due_date, JSON.stringify({ tools: { todos: true, campfire: true, message_board: true } }),
    '2026-10-01T08:00:00Z', now, prj3.category, prj3.client_name
  ]);

  // Project 3 Members
  const p3Members = [
    { id: 'pm_v1', user_id: 'usr_836f261323a28ad1', role: 'owner' },
    { id: 'pm_v2', user_id: 'usr_57afcc741499c5ba', role: 'lead' },
    { id: 'pm_v3', user_id: 'usr_f4dec2cd5b0c7ee1', role: 'member' },
  ];
  for (const m of p3Members) {
    db.run("INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)", [m.id, prj3.id, m.user_id, m.role, now]);
  }

  // Project 3 Todos
  const list3Id = 'lst_verve_main';
  db.run("INSERT INTO todo_lists (id, project_id, name, position, created_by, created_at) VALUES (?, ?, 'Design Tokens & Component Specs', 0, ?, ?)", [list3Id, prj3.id, 'usr_836f261323a28ad1', now]);

  const p3Todos = [
    {
      id: 'td_v1',
      title: 'Audit contrast ratios across dark mode OLED chart telemetry components',
      desc: 'Verify that all biometric vital metrics achieve minimum 7:1 contrast on pure #000000 backgrounds.',
      status: 'completed',
      pipeline_stage: 'concepts-approval',
      priority: 'urgent',
      assignee_id: 'usr_f4dec2cd5b0c7ee1',
      assignee_ids: JSON.stringify(['usr_f4dec2cd5b0c7ee1']),
      votes: JSON.stringify(['usr_836f261323a28ad1', 'usr_57afcc741499c5ba']),
      vote_count: 2,
      due_date: '2026-10-15',
      completed_at: '2026-10-15T18:00:00Z',
    },
    {
      id: 'td_v2',
      title: 'Build fluid ECG cardiac waveform SVG canvas component with real-time scrubbing',
      desc: 'Benchmark 60fps frame rate performance during active continuous data ingestion.',
      status: 'in_progress',
      pipeline_stage: 'creative-review',
      priority: 'high',
      assignee_id: 'usr_836f261323a28ad1',
      assignee_ids: JSON.stringify(['usr_836f261323a28ad1']),
      votes: '[]',
      vote_count: 0,
      due_date: '2026-11-06',
      completed_at: null,
    },
    {
      id: 'td_v3',
      title: 'Prototype interactive medication reminder drawer with micro-interactions',
      desc: 'Test tactile haptic confirmation triggers with clinical accessibility guidelines.',
      status: 'open',
      pipeline_stage: 'scripting',
      priority: 'medium',
      assignee_id: 'usr_57afcc741499c5ba',
      assignee_ids: JSON.stringify(['usr_57afcc741499c5ba']),
      votes: '[]',
      vote_count: 0,
      due_date: '2026-11-16',
      completed_at: null,
    },
  ];

  for (const t of p3Todos) {
    db.run(`
      INSERT INTO todos (id, todo_list_id, project_id, title, description, status, priority, assignee_id, assignee_ids, pipeline_stage, votes, vote_count, due_date, completed_at, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      t.id, list3Id, prj3.id, t.title, t.desc, t.status, t.priority, t.assignee_id, t.assignee_ids,
      t.pipeline_stage, t.votes, t.vote_count, t.due_date, t.completed_at, 'usr_836f261323a28ad1', now, now
    ]);
  }

  // Project 3 Campfire Chat
  const ch3Id = 'ch_verve_campfire';
  db.run("INSERT INTO chat_channels (id, project_id, name, type, created_at) VALUES (?, ?, 'Campfire', 'campfire', ?)", [ch3Id, prj3.id, now]);
  
  db.run(`
    INSERT INTO chat_messages (id, channel_id, author_id, body, type, created_at)
    VALUES 
      ('msg_v_1', '${ch3Id}', 'usr_836f261323a28ad1', 'Design tokens v1.0 are published on GitHub packages. iOS and Web teams can now import identical theme variables.', 'text', '2026-10-26T11:00:00Z'),
      ('msg_v_2', '${ch3Id}', 'usr_f4dec2cd5b0c7ee1', 'All telemetry cards have been tested with VoiceOver and TalkBack. Reading order is logical and compliant.', 'text', '2026-10-26T12:30:00Z')
  `);

  // Synchronously write SQLite database to disk
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  console.log('Seeded 3 human projects successfully! Verifying in DB:');

  const projs = db.exec("SELECT id, name, client_name, category, status FROM projects");
  console.log('Projects created:', JSON.stringify(projs, null, 2));

  const todosCount = db.exec("SELECT count(*) FROM todos");
  console.log('Total Todos created:', todosCount[0]?.values[0][0]);

  const msgsCount = db.exec("SELECT count(*) FROM chat_messages");
  console.log('Total Messages created:', msgsCount[0]?.values[0][0]);
}

main().catch(console.error);
