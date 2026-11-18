/**
 * SPECTER OS — WhatsApp Automated Notification Services
 * Dispatches instant notifications for tasks, milestones, and client reviews
 */

import { WhatsAppClient } from '../client';

export class WhatsAppNotificationService {
  private client = new WhatsAppClient();

  /**
   * Notify a team member when a task is assigned to them
   */
  async notifyTaskAssigned(
    phoneNumber: string,
    taskTitle: string,
    projectName: string,
    dueDate?: string
  ) {
    const text = `📋 Task Assigned — SPECTER OS

Project: ${projectName}
Task: ${taskTitle}
${dueDate ? `Deadline: ${dueDate}\n` : ''}
Log in to view task assets and submit updates: http://localhost:3000`;

    return this.client.sendText({ to: phoneNumber, text });
  }

  /**
   * Alert client or team when a milestone is approaching
   */
  async notifyMilestoneUpcoming(
    phoneNumber: string,
    milestoneTitle: string,
    projectName: string,
    date: string
  ) {
    const text = `📅 Milestone Alert — SPECTER OS

Project: ${projectName}
Milestone: ${milestoneTitle}
Target Date: ${date}

Track timeline progress in your dashboard.`;

    return this.client.sendText({ to: phoneNumber, text });
  }

  /**
   * Notify client that a deliverable is ready for review
   */
  async notifyApprovalRequired(
    clientPhoneNumber: string,
    deliverableTitle: string,
    projectName: string,
    previewUrl?: string
  ) {
    const text = `✨ Deliverable Ready for Review — ${projectName}

Item: ${deliverableTitle}
Status: Awaiting Client Sign-Off

Review and approve here: ${previewUrl || 'http://localhost:3000'}`;

    return this.client.sendInteractiveButtons({
      to: clientPhoneNumber,
      text,
      buttons: [
        { id: 'approve_deliverable', title: 'Approve Deliverable' },
        { id: 'request_changes', title: 'Request Changes' },
      ],
    });
  }

  /**
   * Notify team lead of client approval
   */
  async notifyApprovalDecision(
    leadPhoneNumber: string,
    deliverableTitle: string,
    clientName: string,
    status: 'approved' | 'rejected'
  ) {
    const isApproved = status === 'approved';
    const text = `${isApproved ? '✅ Deliverable Approved' : '⚠️ Changes Requested'} — SPECTER OS

Item: ${deliverableTitle}
Client: ${clientName}
Result: ${isApproved ? 'Sign-off complete. Moved to Deliverables.' : 'Revisions requested by client.'}`;

    return this.client.sendText({ to: leadPhoneNumber, text });
  }
}
