export const APP_NAME = 'SPECTER OS';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'SPECTER OS — Modern project management and team collaboration';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';
export const DEFAULT_LOCALE = 'en-IN';

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  owner: 'Super Admin',
  admin: 'Administrator',
  project_manager: 'Team Lead',
  member: 'Member',
  client: 'Client',
  observer: 'Observer',
  role_not_assigned: 'Role Not Assigned',
  unassigned: 'Role Not Assigned',
  ai_agent: 'AI Agent',
};

export const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 120,
  owner: 100,
  admin: 80,
  project_manager: 60,
  member: 40,
  client: 20,
  observer: 10,
  role_not_assigned: 0,
  unassigned: 0,
  ai_agent: 5,
};

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#E56B70',
  high: '#E9AC57',
  medium: '#6C8EBF',
  low: '#AAB8C0',
};

export const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const STATUS_COLORS: Record<string, string> = {
  open: '#AAB8C0',
  in_progress: '#39C6AE',
  completed: '#52B788',
  cancelled: '#E56B70',
};

export const PROJECT_COLORS = [
  '#39C6AE', '#E9AC57', '#E56B70', '#6C8EBF',
  '#9B7EC8', '#52B788', '#F4A261', '#E76F51',
  '#457B9D', '#A8DADC', '#F1FAEE', '#264653',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const ITEMS_PER_PAGE = 20;

export const KEYBOARD_SHORTCUTS = {
  globalNav: 'shift+j',
  search: 'mod+k',
  newProject: 'mod+shift+p',
  newTask: 'mod+shift+t',
};

export const NOTIFICATION_TYPES_LABELS: Record<string, string> = {
  task_assigned: 'Task Assigned',
  task_due_soon: 'Task Due Soon',
  task_overdue: 'Task Overdue',
  task_completed: 'Task Completed',
  comment_mention: 'Mentioned in Comment',
  comment_reply: 'Reply to Comment',
  message_board_post: 'New Message',
  check_in_reminder: 'Check-in Reminder',
  project_update: 'Project Update',
  direct_message: 'Direct Message',
  project_invitation: 'Project Invitation',
  system: 'System',
};

export const WHATSAPP_API_VERSION = 'v20.0';
export const WHATSAPP_API_BASE = 'https://graph.facebook.com';

export const SUPPORTED_INTEGRATIONS = [
  'whatsapp',
  'google_calendar',
  'google_drive',
  'microsoft_365',
  'slack',
  'zapier',
  'make',
  'email',
  'gemini_ai',
] as const;

export type SupportedIntegration = typeof SUPPORTED_INTEGRATIONS[number];
