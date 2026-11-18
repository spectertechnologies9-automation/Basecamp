import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import { dispatchNotification } from '@/lib/notifications';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user role in project
  const member = await queryOne<any>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [params.id, user.id]
  );
  const isClient = user.role === 'client' || member?.role === 'client';

  let sql = `
    SELECT a.*, 
           u.full_name as submitter_name,
           r.full_name as reviewer_name
    FROM project_approvals a
    LEFT JOIN users u ON u.id = a.submitted_by
    LEFT JOIN users r ON r.id = a.reviewed_by
    WHERE a.project_id = ?
  `;
  const queryParams: any[] = [params.id];

  // 2-tier visibility: Clients only see items after Team Lead approval or direct Lead submissions
  if (isClient) {
    sql += ` AND a.status IN ('pending_client_review', 'changes_requested_by_client', 'approved', 'final')`;
  }

  sql += ' ORDER BY a.created_at DESC';

  const approvals = await query<any>(sql, queryParams);
  return NextResponse.json({ data: approvals });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, file_url, stage } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if submitter is team lead or admin
    const member = await queryOne<any>(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [params.id, user.id]
    );
    const isLeadOrAdmin =
      (user.role as string) === 'admin' ||
      (user.role as string) === 'project_manager' ||
      (user.role as string) === 'owner' ||
      (user.role as string) === 'brand_manager' ||
      member?.role === 'lead' ||
      member?.role === 'owner';

    // 2-tier initial status rule:
    // If submitter is member -> pending_lead_review (requires Team Lead approval first)
    // If submitter is lead/admin -> pending_client_review (directly visible to client)
    const initialStatus = isLeadOrAdmin ? 'pending_client_review' : 'pending_lead_review';

    const id = `appr_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO project_approvals (
        id, project_id, title, description, file_url, status, stage, submitted_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.id,
        title.trim(),
        description?.trim() || null,
        file_url || null,
        initialStatus,
        stage === 'concept' ? 'concept' : 'final',
        user.id,
        now,
        now,
      ]
    );

    // Audit log
    await execute(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, 'approval.submit', 'project', ?, ?)`,
      [`audit_${crypto.randomBytes(8).toString('hex')}`, user.organization_id || 'org_default', user.id, params.id, now]
    );

    // Dispatch notifications
    const project = await queryOne<any>('SELECT name FROM projects WHERE id = ?', [params.id]);
    await dispatchNotification({
      projectId: params.id,
      type: 'approval',
      title: isLeadOrAdmin
        ? `Review Requested for Client: ${title.trim()}`
        : `Member Submission: ${title.trim()} (Needs Lead Approval)`,
      body: `${user.full_name} submitted a deliverable for ${isLeadOrAdmin ? 'client review' : 'internal team lead review'} in ${project?.name || 'Project'}.`,
      actionUrl: `/projects/${params.id}?tab=review-approval`,
      actorId: user.id,
    });

    return NextResponse.json({
      data: {
        id,
        project_id: params.id,
        title: title.trim(),
        description: description?.trim() || null,
        file_url: file_url || null,
        status: initialStatus,
        stage: stage === 'concept' ? 'concept' : 'final',
        submitted_by: user.id,
        submitter_name: user.full_name,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const approval_id = body.approval_id || body.id;
    const { status, feedback } = body;

    if (!approval_id || !status) {
      return NextResponse.json(
        { error: 'Approval ID and status are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await execute(
      `UPDATE project_approvals
       SET status = ?, feedback = ?, reviewed_by = ?, updated_at = ?
       WHERE id = ? AND project_id = ?`,
      [status, feedback?.trim() || null, user.id, now, approval_id, params.id]
    );

    // Audit log
    await execute(
      `INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, ?, 'project', ?, ?)`,
      [
        `audit_${crypto.randomBytes(8).toString('hex')}`,
        user.organization_id || 'org_default',
        user.id,
        `approval.${status}`,
        params.id,
        now,
      ]
    );

    // Notify submitter of approval status change
    const approvalRecord = await queryOne<any>(
      'SELECT title, description, file_url, submitted_by FROM project_approvals WHERE id = ?',
      [approval_id]
    );

    // Automatically add approved file to deliverables
    if ((status === 'approved' || status === 'final') && approvalRecord?.file_url) {
      const existingFile = await queryOne<any>(
        'SELECT id FROM project_files WHERE project_id = ? AND file_path = ? AND category = "deliverable"',
        [params.id, approvalRecord.file_url]
      );
      if (!existingFile) {
        const fileId = `file_${crypto.randomBytes(8).toString('hex')}`;
        await execute(
          `INSERT INTO project_files (
            id, project_id, name, file_path, file_size, mime_type, category, uploaded_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fileId,
            params.id,
            approvalRecord.title || 'Approved Deliverable',
            approvalRecord.file_url,
            102400,
            'application/octet-stream',
            'deliverable',
            user.id,
            now,
          ]
        );
      }
    }

    if (approvalRecord) {
      await dispatchNotification({
        projectId: params.id,
        type: 'approval',
        title: `Deliverable Update: ${approvalRecord.title}`,
        body: `${user.full_name} marked this deliverable as "${status.replace(/_/g, ' ').toUpperCase()}".`,
        actionUrl: `/projects/${params.id}?tab=review-approval`,
        targetUserIds: [approvalRecord.submitted_by],
        actorId: user.id,
      });
    }

    return NextResponse.json({
      data: {
        id: approval_id,
        status,
        feedback: feedback?.trim() || null,
        reviewed_by: user.id,
        reviewer_name: user.full_name,
        updated_at: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const approvalId = searchParams.get('id') || searchParams.get('approval_id');

  if (!approvalId) {
    return NextResponse.json({ error: 'Approval ID is required' }, { status: 400 });
  }

  const isGlobalAdmin = user.role === 'admin' || user.role === 'owner';
  const member = await queryOne<any>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [params.id, user.id]
  );
  const isLead = member?.role === 'lead' || member?.role === 'owner' || member?.role === 'team_lead' || member?.role === 'brand_manager';

  if (!isGlobalAdmin && !isLead) {
    return NextResponse.json({ error: 'Forbidden: Only Team Leads and Admins can delete approvals' }, { status: 403 });
  }

  await execute('DELETE FROM project_approvals WHERE id = ? AND project_id = ?', [approvalId, params.id]);
  return NextResponse.json({ message: 'Deleted approval successfully' });
}
