import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { queryOne, execute } from '@/lib/db';
import { hashPassword, verifyPassword, signToken, SESSION_COOKIE_NAME } from '@/lib/auth/local';
import { dispatchNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, password, project_id, role, invited_email } = body;

    if (!email || !password || !project_id) {
      return NextResponse.json(
        { error: 'Email, password, and project ID are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify invitation email restriction
    if (invited_email && normalizedEmail !== invited_email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: `This invitation was created exclusively for ${invited_email}. Please sign in or register with that email address.` },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // 1. Find or create user
    let user = await queryOne<any>(
      'SELECT id, organization_id, email, password_hash, full_name, role FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (user) {
      // Verify existing password
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'An account with this email already exists with a different password. Please check your credentials.' },
          { status: 400 }
        );
      }
    } else {
      // Create new user
      const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
      const passwordHash = hashPassword(password);
      const appRole = role === 'lead' ? 'brand_manager' : role === 'client' ? 'client' : 'team_member';

      await execute(
        `INSERT INTO users (
          id, organization_id, email, password_hash, full_name, role, timezone, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        [userId, 'org_default', normalizedEmail, passwordHash, full_name.trim(), appRole, 'Asia/Kolkata', now, now]
      );

      await execute(
        'INSERT OR REPLACE INTO organization_members (id, organization_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
        [`mem_${crypto.randomBytes(8).toString('hex')}`, 'org_default', userId, appRole, now]
      );

      user = await queryOne<any>(
        'SELECT id, organization_id, email, full_name, role FROM users WHERE id = ?',
        [userId]
      );
    }

    // 2. Add to project_members
    const existingMember = await queryOne<any>(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [project_id, user.id]
    );

    const projectRole = role === 'lead' ? 'lead' : role === 'client' ? 'client' : 'member';

    if (existingMember) {
      await execute(
        'UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?',
        [projectRole, project_id, user.id]
      );
    } else {
      await execute(
        'INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
        [`pm_${crypto.randomBytes(8).toString('hex')}`, project_id, user.id, projectRole, now]
      );
    }

    // 3. Dispatch notification to Admins & Project Leads
    const project = await queryOne<any>('SELECT name FROM projects WHERE id = ?', [project_id]);
    await dispatchNotification({
      projectId: project_id,
      type: 'member',
      title: '🎉 New Team Member Joined',
      body: `${user.full_name} accepted the invitation to join ${project?.name || 'the project'}.`,
      actionUrl: `/projects/${project_id}`,
      actorId: user.id,
    });

    // 4. Create signed session token and cookie
    const token = signToken({
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
    });

    const response = NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      message: 'Joined project successfully',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to join project' }, { status: 500 });
  }
}
