import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, project_id, role = 'member' } = body;

    if (!email || !project_id) {
      return NextResponse.json(
        { error: 'Email and project_id are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const isGlobalAdmin =
      user.role === 'admin' ||
      user.role === 'owner' ||
      user.role === 'project_manager' ||
      (user.role as string) === 'brand_manager';
    let isLead = isGlobalAdmin;

    if (!isLead) {
      const pm = await queryOne<any>(
        "SELECT role FROM project_members WHERE project_id = ? AND user_id = ? AND (role = 'lead' OR role = 'team_lead' OR role = 'owner')",
        [project_id, user.id]
      );
      if (pm) isLead = true;
    }

    // Ensure invitations table exists
    await execute(`
      CREATE TABLE IF NOT EXISTS invitations (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        invited_email TEXT NOT NULL,
        role TEXT NOT NULL,
        token TEXT NOT NULL,
        created_by TEXT,
        created_at TEXT NOT NULL,
        used_at TEXT
      )
    `);

    const invId = `inv_${crypto.randomBytes(12).toString('hex')}`;
    const token = body.token || `inv_${crypto.randomBytes(16).toString('hex')}`;
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO invitations (id, project_id, invited_email, role, token, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invId, project_id, cleanEmail, role, token, user.id, now]
    );

    // Resolve current application host
    let origin = process.env.NEXT_PUBLIC_APP_URL || '';
    if (!origin) {
      const host = req.headers.get('host') || 'localhost:3000';
      const proto = req.headers.get('x-forwarded-proto') || 'http';
      origin = `${proto}://${host}`;
    }

    const link = `${origin}/auth/join?project_id=${project_id}&role=${role}&email=${encodeURIComponent(cleanEmail)}&token=${token}`;

    return NextResponse.json({
      success: true,
      link,
      token,
      email: cleanEmail,
      project_id,
      role,
    });
  } catch (err: any) {
    console.error('[Generate Invite Error]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate invitation' },
      { status: 500 }
    );
  }
}
