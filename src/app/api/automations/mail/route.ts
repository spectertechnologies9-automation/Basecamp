import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { sendEmail, getEmailConfigStatus } from '@/lib/email';
import type { ApiResponse } from '@/types';

const DEFAULT_AUTOMATIONS = [
  {
    id: 'eml_daily_digest',
    name: 'Morning Task & Agenda Briefing',
    trigger_type: 'daily_8am',
    subject: '☀️ Your SPECTER OS Daily Briefing & Tasks',
    template_body: 'Hello {{name}},\n\nHere is your daily agenda:\n• You have {{due_count}} tasks due today.\n• 1 project milestone scheduled.\n\nHave a productive day!\n— The SPECTER OS Team',
    target_audience: 'all_members',
    is_active: 1,
  },
  {
    id: 'eml_due_reminder',
    name: '24-Hour Task Due Date Warning',
    trigger_type: 'task_due_24h',
    subject: '⚠️ Task Due Soon: {{task_title}}',
    template_body: 'Hi {{name}},\n\nThis is an automated reminder that the task "{{task_title}}" in project "{{project_name}}" is due tomorrow.\n\nPlease update your progress or mark it as complete in SPECTER OS.\n\nView task: {{task_url}}',
    target_audience: 'assignees',
    is_active: 1,
  },
  {
    id: 'eml_checkin_ping',
    name: 'Daily Check-in Reminder (5:00 PM)',
    trigger_type: 'daily_5pm',
    subject: '📋 Quick Check-in: What did you work on today?',
    template_body: 'Hey {{name}},\n\nTime for today\'s automatic check-in! Take 60 seconds to share what you accomplished today and if anything is blocking you.\n\nReply to this email or visit SPECTER OS to post your update.',
    target_audience: 'all_members',
    is_active: 1,
  },
  {
    id: 'eml_project_welcome',
    name: 'New Project Member Onboarding',
    trigger_type: 'project_added',
    subject: '🎉 You have been added to {{project_name}}',
    template_body: 'Welcome aboard {{name}}!\n\nYou were just added to project "{{project_name}}". Check out the project campfire, review documents, and view current deliverables on your project board.',
    target_audience: 'new_members',
    is_active: 1,
  },
  {
    id: 'eml_weekly_digest',
    name: 'Weekly Team Accomplishments Digest',
    trigger_type: 'weekly_friday_5pm',
    subject: '🏆 SPECTER OS Weekly Wrap-Up & Progress',
    template_body: 'Happy Friday {{name}}!\n\nHere is what our team accomplished across all projects this week:\n• Completed todos: {{completed_count}}\n• Active discussions: {{discussions_count}}\n\nHave a wonderful weekend!',
    target_audience: 'all_members',
    is_active: 1,
  },
];

// GET /api/automations/mail
export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const orgId = user.organization_id || 'org_default';

  // Seed default automations if none exist
  let automations = await query<any>(
    'SELECT * FROM email_automations WHERE organization_id = ? ORDER BY created_at ASC',
    [orgId]
  );

  if (automations.length === 0) {
    const now = new Date().toISOString();
    for (const a of DEFAULT_AUTOMATIONS) {
      await execute(
        `INSERT INTO email_automations (id, organization_id, name, trigger_type, subject, template_body, target_audience, is_active, last_triggered_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, orgId, a.name, a.trigger_type, a.subject, a.template_body, a.target_audience, a.is_active, now, now, now]
      );
    }
    automations = await query<any>(
      'SELECT * FROM email_automations WHERE organization_id = ? ORDER BY created_at ASC',
      [orgId]
    );
  }

  // Fetch recent email delivery logs
  const logs = await query<any>(
    'SELECT * FROM email_logs WHERE organization_id = ? ORDER BY created_at DESC LIMIT 50',
    [orgId]
  );

  return NextResponse.json<ApiResponse>({
    data: {
      automations,
      logs,
      providerConfig: getEmailConfigStatus(),
    },
  });
}

// POST /api/automations/mail
export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { action } = body;
    const orgId = user.organization_id || 'org_default';
    const now = new Date().toISOString();

    // Toggle automation trigger on/off
    if (action === 'toggle') {
      const { id, is_active } = body;
      await execute(
        'UPDATE email_automations SET is_active = ?, updated_at = ? WHERE id = ? AND organization_id = ?',
        [is_active ? 1 : 0, now, id, orgId]
      );
      return NextResponse.json<ApiResponse>({ message: 'Automation updated' });
    }

    // Trigger email send (broadcast or sequence trigger)
    if (action === 'send' || action === 'broadcast') {
      const { recipient_email, recipient_name, subject, message_body, automation_id, project_id } = body;

      if (!recipient_email || !subject || !message_body) {
        return NextResponse.json<ApiResponse>({ error: 'Recipient, subject, and message are required' }, { status: 400 });
      }

      // Execute dispatch through unified Email Engine
      const result = await sendEmail({
        to: recipient_email,
        recipientName: recipient_name,
        subject,
        body: message_body,
        organizationId: orgId,
        automationId: automation_id,
        projectId: project_id,
      });

      // If an automation_id was provided, update last_triggered_at
      if (automation_id) {
        await execute(
          'UPDATE email_automations SET last_triggered_at = ? WHERE id = ?',
          [now, automation_id]
        );
      }

      // Record in audit log
      await execute(
        'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`aud_${crypto.randomBytes(8).toString('hex')}`, orgId, user.id, `sent email "${subject}" to ${recipient_email} (${result.provider})`, 'email', result.messageId, now]
      );

      return NextResponse.json<ApiResponse>({
        message: `Email dispatched successfully via ${result.provider}`,
        data: {
          id: result.messageId,
          recipient_email,
          subject,
          provider: result.provider,
          status: 'delivered',
          created_at: now,
        },
      });
    }

    return NextResponse.json<ApiResponse>({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
