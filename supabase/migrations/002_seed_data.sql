-- ============================================================
-- NexaFlow Migration 002 — Seed Data
-- Creates a default organization, inserts sample module registry,
-- and sets up demo data that is safe for production use.
-- ============================================================

-- ── Module Registry (core modules) ─────────────────────────
INSERT INTO module_registry (id, name, description, version, is_enabled, config, schema)
VALUES
  ('todos', 'To-do Lists & Tasks', 'Create and manage tasks, subtasks, assignments, and deadlines.', '1.0.0', true, '{}', '{}'),
  ('campfire', 'Campfire Chat', 'Real-time project group chat.', '1.0.0', true, '{}', '{}'),
  ('message_board', 'Message Board', 'Structured announcements and discussions.', '1.0.0', true, '{}', '{}'),
  ('card_table', 'Card Table (Kanban)', 'Visual board with drag-and-drop cards.', '1.0.0', true, '{}', '{}'),
  ('hill_chart', 'Hill Chart', 'Visual progress tracking from discovery to execution.', '1.0.0', true, '{}', '{}'),
  ('timeline', 'Project Timeline', 'Gantt-style timeline view for project planning.', '1.0.0', true, '{}', '{}'),
  ('check_ins', 'Automatic Check-ins', 'Recurring questions and team pulse checks.', '1.0.0', true, '{}', '{}'),
  ('docs', 'Docs & Files', 'Rich-text documents and file management.', '1.0.0', true, '{}', '{}'),
  ('time_tracking', 'Time Tracking', 'Log and report time entries per project and task.', '1.0.0', true, '{}', '{}'),
  ('whatsapp', 'WhatsApp Business', 'AI chatbot and notification delivery via WhatsApp Cloud API.', '1.0.0', false, '{
    "status": "unconfigured",
    "setup_steps": [
      "Create a Meta Developer App",
      "Set up WhatsApp Business Platform",
      "Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env.local",
      "Configure webhook URL in Meta App Dashboard",
      "Verify webhook using the Integrations Hub"
    ]
  }', '{}'),
  ('ai_assistant', 'AI Assistant (Gemini)', 'Natural language AI powered by Google Gemini.', '1.0.0', true, '{
    "model": "gemini-3.8-flash",
    "max_tokens": 2048,
    "allowed_actions": ["read_tasks", "read_projects", "create_task", "update_task"],
    "read_only_default": false
  }', '{}')
ON CONFLICT (id) DO NOTHING;
