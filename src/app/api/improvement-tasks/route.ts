import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import type { ApiResponse } from '@/types';

// GET /api/improvement-tasks
export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner' || user.email?.includes('admin');

  try {
    if (isAdmin) {
      // 1. All improvement tasks for Admin review
      const tasks = await query<any>(
        `SELECT it.*, 
                u.full_name as member_name, 
                u.email as member_email, 
                u.avatar_url as member_avatar,
                u.role as member_role,
                admin_u.full_name as assigner_name
         FROM improvement_tasks it
         JOIN users u ON u.id = it.assigned_to
         LEFT JOIN users admin_u ON admin_u.id = it.assigned_by
         ORDER BY 
           CASE WHEN it.status = 'submitted' THEN 0 
                WHEN it.status = 'assigned' THEN 1 
                ELSE 2 END,
           it.created_at DESC`
      );

      // 2. Persistent Leaderboard / Score Tracker
      // Compute total points awarded and completed count per member/lead
      const scores = await query<any>(
        `SELECT u.id, u.full_name, u.email, u.avatar_url, u.role,
                COALESCE(SUM(CASE WHEN it.status = 'awarded' THEN it.points_awarded ELSE 0 END), 0) as total_points,
                COALESCE(SUM(CASE WHEN it.status = 'awarded' THEN 1 ELSE 0 END), 0) as completed_tasks,
                COALESCE(COUNT(it.id), 0) as total_assigned
         FROM users u
         LEFT JOIN improvement_tasks it ON it.assigned_to = u.id
         WHERE u.role != 'client' AND u.role != 'owner'
         GROUP BY u.id, u.full_name, u.email, u.avatar_url, u.role
         ORDER BY total_points DESC, completed_tasks DESC, u.full_name ASC`
      );

      return NextResponse.json<ApiResponse>({
        data: {
          tasks,
          leaderboard: scores,
          isAdmin: true,
        },
      });
    } else {
      // Member / Team Lead: ONLY their own improvement tasks
      const tasks = await query<any>(
        `SELECT it.*, 
                admin_u.full_name as assigner_name
         FROM improvement_tasks it
         LEFT JOIN users admin_u ON admin_u.id = it.assigned_by
         WHERE it.assigned_to = ?
         ORDER BY 
           CASE WHEN it.status = 'assigned' THEN 0 
                WHEN it.status = 'submitted' THEN 1 
                ELSE 2 END,
           it.created_at DESC`,
        [user.id]
      );

      const stats = await queryOne<any>(
        `SELECT 
           COALESCE(SUM(CASE WHEN status = 'awarded' THEN points_awarded ELSE 0 END), 0) as total_points,
           COALESCE(SUM(CASE WHEN status = 'awarded' THEN 1 ELSE 0 END), 0) as completed_count,
           COALESCE(SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END), 0) as pending_count
         FROM improvement_tasks
         WHERE assigned_to = ?`,
        [user.id]
      );

      return NextResponse.json<ApiResponse>({
        data: {
          tasks,
          stats: stats || { total_points: 0, completed_count: 0, pending_count: 0 },
          isAdmin: false,
        },
      });
    }
  } catch (error: any) {
    console.error('Error fetching improvement tasks:', error);
    return NextResponse.json<ApiResponse>({ error: 'Failed to fetch improvement tasks' }, { status: 500 });
  }
}

// POST /api/improvement-tasks - Admin creates/assigns task
export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner' || user.email?.includes('admin');
  if (!isAdmin) {
    return NextResponse.json<ApiResponse>({ error: 'Only administrators can assign improvement tasks' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { assigned_to, title, description = '', category = 'skill', points_reward = 50 } = body;

    if (!assigned_to || !title?.trim()) {
      return NextResponse.json<ApiResponse>({ error: 'Recipient and task title are required' }, { status: 400 });
    }

    const id = `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO improvement_tasks (
        id, organization_id, assigned_to, assigned_by, title, description, category, points_reward, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'assigned', ?, ?)`,
      [
        id,
        user.organization_id || 'org_default',
        assigned_to,
        user.id,
        title.trim(),
        description.trim(),
        category,
        Number(points_reward) || 50,
        now,
        now,
      ]
    );

    return NextResponse.json<ApiResponse>({
      data: { id, title: title.trim(), points_reward },
      message: 'Improvement task assigned successfully',
    });
  } catch (error: any) {
    console.error('Error creating improvement task:', error);
    return NextResponse.json<ApiResponse>({ error: 'Failed to assign task' }, { status: 500 });
  }
}

// PATCH /api/improvement-tasks - Member submits OR Admin awards points
export async function PATCH(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = user.role === 'admin' || user.role === 'owner' || user.email?.includes('admin');

  try {
    const body = await req.json();
    const { id, action, submission_notes, submission_url, points_awarded, admin_feedback } = body;

    if (!id) {
      return NextResponse.json<ApiResponse>({ error: 'Task ID is required' }, { status: 400 });
    }

    const existing = await queryOne<any>('SELECT * FROM improvement_tasks WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json<ApiResponse>({ error: 'Task not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // 1. Member/Lead Submits Task
    if (action === 'submit') {
      if (existing.assigned_to !== user.id && !isAdmin) {
        return NextResponse.json<ApiResponse>({ error: 'You can only submit your own tasks' }, { status: 403 });
      }

      await execute(
        `UPDATE improvement_tasks 
         SET status = 'submitted', 
             submission_notes = ?, 
             submission_url = ?, 
             submitted_at = ?,
             updated_at = ?
         WHERE id = ?`,
        [submission_notes?.trim() || 'Task marked as completed', submission_url?.trim() || null, now, now, id]
      );

      return NextResponse.json<ApiResponse>({ message: 'Task submitted for review! Admin will award points shortly.' });
    }

    // 2. Admin Awards Points
    if (action === 'award') {
      if (!isAdmin) {
        return NextResponse.json<ApiResponse>({ error: 'Only admins can award points' }, { status: 403 });
      }

      const points = points_awarded !== undefined ? Number(points_awarded) : Number(existing.points_reward) || 50;

      await execute(
        `UPDATE improvement_tasks 
         SET status = 'awarded', 
             points_awarded = ?, 
             admin_feedback = ?, 
             awarded_at = ?,
             updated_at = ?
         WHERE id = ?`,
        [points, admin_feedback?.trim() || 'Great work! Points awarded.', now, now, id]
      );

      return NextResponse.json<ApiResponse>({ message: `Successfully awarded ${points} points!` });
    }

    // 3. Admin Requests Revision
    if (action === 'revision') {
      if (!isAdmin) {
        return NextResponse.json<ApiResponse>({ error: 'Only admins can request revision' }, { status: 403 });
      }

      await execute(
        `UPDATE improvement_tasks 
         SET status = 'needs_revision', 
             admin_feedback = ?, 
             updated_at = ?
         WHERE id = ?`,
        [admin_feedback?.trim() || 'Please provide more details or proof of completion.', now, id]
      );

      return NextResponse.json<ApiResponse>({ message: 'Revision requested.' });
    }

    return NextResponse.json<ApiResponse>({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating improvement task:', error);
    return NextResponse.json<ApiResponse>({ error: 'Failed to update task' }, { status: 500 });
  }
}
