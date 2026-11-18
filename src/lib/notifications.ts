import crypto from 'crypto';
import { query, execute } from '@/lib/db';

export interface NotificationPayload {
  projectId: string;
  type: 'todo' | 'event' | 'approval' | 'announcement' | 'member';
  title: string;
  body?: string;
  actionUrl?: string;
  actorId?: string;
  targetUserIds?: string[]; // Specific users (e.g. assignees of a todo)
}

/**
 * Dispatches notifications based on strict project & role-based scoping:
 * - Admins receive all notifications across all projects.
 * - Team Leads receive all notifications for their assigned projects.
 * - Scheduled events / Milestones / Announcements: All project members & clients receive it.
 * - To-do tasks: Only the specific assigned members (+ Team Leads & Admins) receive it.
 */
export async function dispatchNotification({
  projectId,
  type,
  title,
  body = '',
  actionUrl = '',
  actorId,
  targetUserIds = [],
}: NotificationPayload): Promise<void> {
  try {
    const recipients = new Set<string>();

    // 1. All Administrators receive everything across the workspace
    const adminRows = await query<any>(
      "SELECT id FROM users WHERE role IN ('admin', 'owner') AND is_active = 1"
    );
    adminRows.forEach((u) => recipients.add(u.id));

    // 2. Team Leads of this specific project receive all project info
    const leadRows = await query<any>(
      `SELECT pm.user_id 
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? AND pm.role IN ('lead', 'owner', 'manager') AND u.is_active = 1`,
      [projectId]
    );
    leadRows.forEach((l) => recipients.add(l.user_id));

    // Also include global brand managers who are assigned
    const globalLeads = await query<any>(
      `SELECT pm.user_id
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? AND u.role = 'brand_manager' AND u.is_active = 1`,
      [projectId]
    );
    globalLeads.forEach((l) => recipients.add(l.user_id));

    // 3. Project-wide broadcasts (Events, Milestones, Announcements) -> All project members and clients
    if (type === 'event' || type === 'announcement') {
      const allMembers = await query<any>(
        `SELECT pm.user_id 
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = ? AND u.is_active = 1`,
        [projectId]
      );
      allMembers.forEach((m) => recipients.add(m.user_id));
    }

    // 4. Task-specific notifications -> Only target assignees
    if (type === 'todo' || type === 'approval') {
      targetUserIds.forEach((uid) => {
        if (uid) recipients.add(uid);
      });
    }

    // Never notify the actor themselves about their own action if desired (or allow self-notification)
    if (actorId) {
      recipients.delete(actorId);
    }

    if (recipients.size === 0) return;

    const now = new Date().toISOString();
    for (const recipientId of Array.from(recipients)) {
      const notifId = `notif_${crypto.randomBytes(8).toString('hex')}`;
      await execute(
        `INSERT INTO notifications (
          id, user_id, type, title, body, action_url, actor_id, project_id, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [notifId, recipientId, type, title, body, actionUrl, actorId || null, projectId, now]
      );
    }
  } catch (err) {
    console.error('Failed to dispatch notifications:', err);
  }
}
