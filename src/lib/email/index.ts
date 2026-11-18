import crypto from 'crypto';
import { execute, query } from '@/lib/db';

export interface EmailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  body: string;
  html?: string;
  organizationId?: string;
  automationId?: string;
  projectId?: string;
}

export interface EmailProviderStatus {
  activeProvider: 'resend' | 'sendgrid' | 'brevo' | 'postmark' | 'simulation';
  isLive: boolean;
  fromEmail: string;
  configuredProviders: string[];
}

export function getEmailConfigStatus(): EmailProviderStatus {
  const fromEmail = process.env.EMAIL_FROM || 'SPECTER OS <notifications@specteros.app>';
  const configured: string[] = [];

  if (process.env.RESEND_API_KEY) configured.push('resend');
  if (process.env.SENDGRID_API_KEY) configured.push('sendgrid');
  if (process.env.BREVO_API_KEY) configured.push('brevo');
  if (process.env.POSTMARK_SERVER_TOKEN) configured.push('postmark');

  let activeProvider: EmailProviderStatus['activeProvider'] = 'simulation';
  if (process.env.RESEND_API_KEY) activeProvider = 'resend';
  else if (process.env.SENDGRID_API_KEY) activeProvider = 'sendgrid';
  else if (process.env.BREVO_API_KEY) activeProvider = 'brevo';
  else if (process.env.POSTMARK_SERVER_TOKEN) activeProvider = 'postmark';

  return {
    activeProvider,
    isLive: activeProvider !== 'simulation',
    fromEmail,
    configuredProviders: configured,
  };
}

export async function sendEmail({
  to,
  recipientName,
  subject,
  body,
  html,
  organizationId = 'org_default',
  automationId,
  projectId,
}: EmailOptions): Promise<{ success: boolean; provider: string; messageId: string; error?: string }> {
  const normalizedEmail = to.toLowerCase().trim();
  const fromEmail = process.env.EMAIL_FROM || 'SPECTER OS <notifications@specteros.app>';
  const htmlContent = html || body.replace(/\n/g, '<br/>');
  const logId = `eml_${crypto.randomBytes(8).toString('hex')}`;

  // 1. Resend API (Recommended for Next.js - Zero external npm dependencies)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [normalizedEmail],
          subject,
          text: body,
          html: htmlContent,
        }),
      });

      const json = await res.json();
      if (res.ok && json.id) {
        await logEmail({
          logId,
          organizationId,
          automationId,
          projectId,
          email: normalizedEmail,
          name: recipientName,
          subject,
          body,
          status: 'delivered',
        });
        return { success: true, provider: 'resend', messageId: json.id };
      } else {
        console.warn('[Resend API Error]:', json);
      }
    } catch (err: any) {
      console.error('Resend delivery failed, falling back:', err.message);
    }
  }

  // 2. SendGrid REST API
  if (process.env.SENDGRID_API_KEY) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: normalizedEmail, name: recipientName }] }],
          from: { email: fromEmail.includes('<') ? fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail : fromEmail },
          subject,
          content: [
            { type: 'text/plain', value: body },
            { type: 'text/html', value: htmlContent },
          ],
        }),
      });

      if (res.ok || res.status === 202) {
        const msgId = res.headers.get('x-message-id') || logId;
        await logEmail({
          logId,
          organizationId,
          automationId,
          projectId,
          email: normalizedEmail,
          name: recipientName,
          subject,
          body,
          status: 'delivered',
        });
        return { success: true, provider: 'sendgrid', messageId: msgId };
      }
    } catch (err: any) {
      console.error('SendGrid delivery failed:', err.message);
    }
  }

  // 3. Brevo (Sendinblue) REST API
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: fromEmail.includes('<') ? fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail : fromEmail },
          to: [{ email: normalizedEmail, name: recipientName }],
          subject,
          textContent: body,
          htmlContent,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        await logEmail({
          logId,
          organizationId,
          automationId,
          projectId,
          email: normalizedEmail,
          name: recipientName,
          subject,
          body,
          status: 'delivered',
        });
        return { success: true, provider: 'brevo', messageId: json.messageId || logId };
      }
    } catch (err: any) {
      console.error('Brevo delivery failed:', err.message);
    }
  }

  // 4. Local Development Simulation Mode (Zero friction, persistent SQLite log)
  console.log(`[SPECTER OS EMAIL ENGINE — SIMULATED DISPATCH]
To: ${recipientName ? `${recipientName} <${normalizedEmail}>` : normalizedEmail}
Subject: ${subject}
Date: ${new Date().toISOString()}
Provider: local_simulation
Content:
${body}
-------------------------------------------------------------`);

  await logEmail({
    logId,
    organizationId,
    automationId,
    projectId,
    email: normalizedEmail,
    name: recipientName,
    subject,
    body,
    status: 'simulated_delivered',
  });

  return { success: true, provider: 'simulation', messageId: logId };
}

async function logEmail({
  logId,
  organizationId,
  automationId,
  projectId,
  email,
  name,
  subject,
  body,
  status,
}: {
  logId: string;
  organizationId: string;
  automationId?: string;
  projectId?: string;
  email: string;
  name?: string;
  subject: string;
  body: string;
  status: string;
}) {
  try {
    const now = new Date().toISOString();
    await execute(
      `INSERT INTO email_logs (id, organization_id, automation_id, recipient_email, recipient_name, subject, body, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, organizationId, automationId || null, email, name || null, subject, body, status, now]
    );
  } catch (err) {
    console.error('Failed to record email log:', err);
  }
}

export async function sendProjectInviteEmail({
  to,
  recipientName,
  projectName,
  role,
  inviteUrl,
  projectId,
}: {
  to: string;
  recipientName?: string;
  projectName: string;
  role: string;
  inviteUrl: string;
  projectId?: string;
}) {
  const roleTitle = role === 'lead' ? 'Team Lead' : role === 'client' ? 'Client' : 'Team Member';
  const subject = `🚀 You've been invited to join ${projectName} on SPECTER OS`;
  const body = `Hello ${recipientName || 'there'},\n\nYou have been invited to collaborate on the project "${projectName}" as a ${roleTitle}.\n\nClick the link below to accept your invitation and access your workspace:\n${inviteUrl}\n\nWelcome to the team!\n— The SPECTER OS Team`;

  return sendEmail({
    to,
    recipientName,
    subject,
    body,
    projectId,
  });
}
