/**
 * SPECTER OS — WhatsApp Command & AI Router
 * Parses user commands or routes conversational requests to the Multi-Model AI Engine
 */

import { query, queryOne } from '@/lib/db';
import { executeAIRoute } from '@/lib/ai/router';

export interface CommandContext {
  phoneNumber: string;
  senderName?: string;
  projectId?: string;
}

export async function handleWhatsAppMessage(text: string, ctx: CommandContext): Promise<string> {
  const clean = text.trim().toLowerCase();

  // 1. HELP COMMAND
  if (clean === '/help' || clean === 'help' || clean === 'menu') {
    return `SPECTER OS WhatsApp Assistant

Available Commands:
• /tasks — View your assigned tasks and current progress
• /milestones — View upcoming project milestone deadlines
• /approvals — View deliverables awaiting sign-off
• /status — Executive summary of active project sprint

You can also ask any question in plain English (e.g. "What are the priority items due this week?").`;
  }

  // 2. TASKS COMMAND
  if (clean === '/tasks' || clean === 'tasks' || clean.includes('my task')) {
    const tasks = await query<any>(
      `SELECT t.title, t.status, t.due_date, p.name as project_name
       FROM todos t
       JOIN projects p ON p.id = t.project_id
       WHERE t.status != 'completed' AND t.status != 'done'
       ORDER BY t.due_date ASC LIMIT 5`
    );

    if (!tasks || tasks.length === 0) {
      return `All caught up! There are no open tasks currently pending for your account.`;
    }

    const items = tasks.map((t, i) => `${i + 1}. ${t.title} [${t.project_name}] - Due: ${t.due_date || 'No date'}`).join('\n');
    return `Open Project Tasks (${tasks.length}):\n\n${items}\n\nType the task number or name for more details.`;
  }

  // 3. MILESTONES COMMAND
  if (clean === '/milestones' || clean === 'milestones' || clean.includes('deadline')) {
    const events = await query<any>(
      `SELECT title, start_at FROM calendar_events ORDER BY start_at ASC LIMIT 4`
    );

    if (!events || events.length === 0) {
      return `No upcoming milestones currently scheduled on the calendar.`;
    }

    const items = events.map((e) => `• ${e.title} (${e.start_at ? e.start_at.slice(0, 10) : 'TBD'})`).join('\n');
    return `Upcoming Milestones:\n\n${items}`;
  }

  // 4. APPROVALS COMMAND
  if (clean === '/approvals' || clean === 'approvals' || clean.includes('review')) {
    const approvals = await query<any>(
      `SELECT title, stage, status FROM project_approvals WHERE status != 'approved' LIMIT 5`
    );

    if (!approvals || approvals.length === 0) {
      return `All deliverables have been approved. No items are currently waiting for sign-off.`;
    }

    const items = approvals.map((a, i) => `${i + 1}. ${a.title} (${a.stage}) — Status: ${a.status}`).join('\n');
    return `Deliverables in Review (${approvals.length}):\n\n${items}`;
  }

  // 5. STATUS COMMAND
  if (clean === '/status' || clean === 'status') {
    const openTasks = await queryOne<{ count: number }>("SELECT count(*) as count FROM todos WHERE status != 'completed'");
    const activeProjects = await queryOne<{ count: number }>("SELECT count(*) as count FROM projects WHERE status = 'active'");
    return `SPECTER OS Workspace Health:
• Active Projects: ${activeProjects?.count || 0}
• Open Deliverable Tasks: ${openTasks?.count || 0}
• System Status: All automation channels operational`;
  }

  // 6. NATURAL CONVERSATION VIA MULTI-MODEL AI ROUTER (OpenRouter -> Grok -> Qwen -> Gemini)
  try {
    const projects = await query<any>("SELECT name, client_name, due_date FROM projects WHERE status != 'deleted' LIMIT 5");
    const tasks = await query<any>("SELECT title, status, due_date FROM todos WHERE status != 'completed' LIMIT 8");

    const systemPrompt = `You are the SPECTER OS WhatsApp Assistant.
Speak warmly, concisely, and conversationally.
CRITICAL RULE: NEVER use markdown asterisks (* or **). Use clean hyphens or bullet points.
Grounded Project Context:
Active Projects: ${JSON.stringify(projects)}
Active Tasks: ${JSON.stringify(tasks)}
Keep the WhatsApp reply concise, friendly, and easy to read on mobile.`;

    const aiReply = await executeAIRoute({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
      maxTokens: 300,
    });

    if (aiReply) {
      return aiReply.replace(/\*/g, '');
    }
  } catch (err) {
    console.warn('[WhatsApp Bot AI Error]', err);
  }

  return `I received your message: "${text}". Type /help to see all available commands or ask about project status, tasks, or milestones.`;
}
