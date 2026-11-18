// User & Auth
export type UserRole = 'owner' | 'admin' | 'project_manager' | 'member' | 'client' | 'observer' | 'ai_agent' | 'role_not_assigned' | 'unassigned';

export interface User {
  id: string;
  organization_id?: string;
  email: string;
  full_name: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  role: UserRole; // org-level role
  timezone: string;
  locale: string;
  is_active: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  timezone: string;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  default_timezone: string;
  allowed_domains?: string[];
  require_invite: boolean;
  max_projects?: number;
  features: FeatureFlags;
}

export interface FeatureFlags {
  todos: boolean;
  campfire: boolean;
  message_board: boolean;
  card_table: boolean;
  hill_chart: boolean;
  timeline: boolean;
  check_ins: boolean;
  docs: boolean;
  time_tracking: boolean;
  whatsapp: boolean;
  ai_assistant: boolean;
}

// Project
export type ProjectStatus = 'active' | 'archived' | 'on_hold' | 'completed';
export type ProjectVisibility = 'private' | 'organization' | 'public';

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  owner_id: string;
  start_date?: string;
  end_date?: string;
  is_client_project: boolean;
  settings: ProjectSettings;
  created_at: string;
  updated_at: string;
  // Relations (optional, loaded as needed)
  members?: ProjectMember[];
  owner?: User;
}

export interface ProjectSettings {
  tools: {
    todos: boolean;
    campfire: boolean;
    message_board: boolean;
    card_table: boolean;
    hill_chart: boolean;
    timeline: boolean;
    check_ins: boolean;
    docs: boolean;
  };
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: UserRole;
  user?: User;
  joined_at: string;
}

// Tasks
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TodoList {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  position: number;
  is_completed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  todos?: Todo[];
}

export interface Todo {
  id: string;
  todo_list_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_ids: string[];
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  position: number;
  parent_id?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  assignees?: User[];
  subtodos?: Todo[];
  comments?: Comment[];
  custom_fields?: CustomFieldValue[];
}

// Comments
export interface Comment {
  id: string;
  body: string;
  author_id: string;
  author?: User;
  parent_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

// Notifications
export type NotificationType =
  | 'task_assigned' | 'task_due_soon' | 'task_overdue' | 'task_completed'
  | 'comment_mention' | 'comment_reply' | 'message_board_post'
  | 'check_in_reminder' | 'project_update' | 'direct_message'
  | 'project_invitation' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  action_url?: string;
  actor_id?: string;
  actor?: User;
  project_id?: string;
  project?: Project;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// Messages (Campfire / Direct)
export interface ChatChannel {
  id: string;
  project_id?: string; // null = DM channel
  name: string;
  type: 'campfire' | 'dm' | 'group_dm';
  participant_ids: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  author_id: string;
  author?: User;
  body: string;
  type: 'text' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  reply_to_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

// Message Board
export interface MessageBoardPost {
  id: string;
  project_id: string;
  title: string;
  body: string;
  author_id: string;
  author?: User;
  is_pinned: boolean;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

// Calendar Events
export interface CalendarEvent {
  id: string;
  organization_id: string;
  project_id?: string;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  timezone: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  participant_ids: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Card Table (Kanban)
export interface CardTable {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface CardTableColumn {
  id: string;
  card_table_id: string;
  name: string;
  position: number;
  color?: string;
  wip_limit?: number;
}

export interface Card {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  assignee_ids: string[];
  due_date?: string;
  position: number;
  color?: string;
  labels: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Hill Chart
export interface HillChartPoint {
  id: string;
  project_id: string;
  todo_id?: string;
  label: string;
  progress: number; // 0-100
  color: string;
  notes?: string;
  created_at: string;
}

// Check-ins
export interface CheckIn {
  id: string;
  project_id: string;
  question: string;
  schedule: string; // cron
  participant_ids: string[];
  deadline_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface CheckInResponse {
  id: string;
  check_in_id: string;
  user_id: string;
  user?: User;
  response: string;
  created_at: string;
}

// Docs & Files
export interface Document {
  id: string;
  project_id: string;
  folder_id?: string;
  title: string;
  body: string; // rich text JSON or markdown
  author_id: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FileItem {
  id: string;
  project_id: string;
  folder_id?: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  public_url?: string;
  uploaded_by: string;
  created_at: string;
}

export interface Folder {
  id: string;
  project_id: string;
  parent_id?: string;
  name: string;
  created_at: string;
}

// Time Tracking
export interface TimeEntry {
  id: string;
  project_id: string;
  todo_id?: string;
  user_id: string;
  date: string;
  duration_minutes: number;
  notes?: string;
  created_at: string;
}

// Custom Fields
export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'user' | 'checkbox' | 'url';

export interface CustomField {
  id: string;
  organization_id: string;
  entity_type: 'todo' | 'project' | 'card';
  name: string;
  field_type: CustomFieldType;
  options?: string[];
  is_required: boolean;
  position: number;
  created_at: string;
}

export interface CustomFieldValue {
  field_id: string;
  value: string | number | boolean | string[] | null;
}

// Design System / Admin Studio
export interface DesignTokens {
  colors: Record<string, string>;
  typography: {
    fontFamily: string;
    fontSizes: Record<string, string>;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: Record<string, string>;
}

export interface LayoutConfig {
  id: string;
  page: string;
  components: ComponentConfig[];
  version: number;
  is_published: boolean;
  created_at: string;
}

export interface ComponentConfig {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: ComponentConfig[];
  conditions?: DisplayCondition[];
}

export interface DisplayCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in';
  value: unknown;
}

// Module Registry
export interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
  schema: Record<string, unknown>;
}

// Integrations
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface Integration {
  id: string;
  organization_id: string;
  provider: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  last_synced_at?: string;
  error_message?: string;
  created_at: string;
}

// WhatsApp
export interface WhatsAppContact {
  id: string;
  user_id: string;
  phone_number: string;
  display_name?: string;
  is_verified: boolean;
  verification_code?: string;
  verification_expires_at?: string;
  opted_in: boolean;
  created_at: string;
}

export interface WhatsAppMessage {
  id: string;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  message_id: string; // Meta message ID
  type: 'text' | 'template' | 'interactive' | 'image' | 'document';
  body: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
}

// Audit
export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id?: string;
  actor?: User;
  action: string;
  entity_type: string;
  entity_id: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Activity Feed
export interface ActivityItem {
  id: string;
  actor: User;
  action: string;
  target_type: string;
  target_id: string;
  target_name: string;
  project?: Project;
  created_at: string;
}

// Navigation
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: number;
  is_active?: boolean;
  children?: NavItem[];
}

export interface RecentlyVisited {
  id: string;
  name: string;
  href: string;
  type: 'project' | 'page' | 'person';
  icon?: string;
  visited_at: string;
}
