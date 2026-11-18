import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    // Get projects map
    const projects = await query<any>('SELECT id, name FROM projects');
    const nameMap: Record<string, string> = {};
    for (const p of projects) {
      nameMap[p.id] = p.name;
    }

    // Fetch todos
    let todoSql = 'SELECT id, title, pipeline_stage, project_id, due_date, status, created_at FROM todos';
    let todoParams: any[] = [];
    if (projectId) {
      todoSql += ' WHERE project_id = ?';
      todoParams.push(projectId);
    }
    const todos = await query<any>(todoSql, todoParams);

    // Fetch file approvals
    let fileSql = 'SELECT id, file_path, pipeline_stage, project_id, status, created_at FROM file_approvals';
    let fileParams: any[] = [];
    if (projectId) {
      fileSql += ' WHERE project_id = ?';
      fileParams.push(projectId);
    }
    const files = await query<any>(fileSql, fileParams);

    // Fetch scheduled posts
    let postSql = 'SELECT id, title, pipeline_stage, project_id, platform, status, scheduled_date, created_at FROM scheduled_posts';
    let postParams: any[] = [];
    if (projectId) {
      postSql += ' WHERE project_id = ?';
      postParams.push(projectId);
    }
    const posts = await query<any>(postSql, postParams);

    const cards: any[] = [];

    for (const t of todos) {
      cards.push({
        id: t.id,
        title: t.title,
        stage: t.pipeline_stage || 'concepts-approval',
        source: 'todo',
        projectId: t.project_id,
        projectName: nameMap[t.project_id] || 'General',
        dueDate: t.due_date || undefined,
        status: t.status,
        createdAt: t.created_at,
      });
    }

    for (const f of files) {
      const fileName = (f.file_path || 'File').split('/').pop() || 'Asset';
      cards.push({
        id: f.id,
        title: fileName,
        stage: f.pipeline_stage || 'concepts-approval',
        source: 'file_approval',
        projectId: f.project_id,
        projectName: nameMap[f.project_id] || 'General',
        status: f.status,
        createdAt: f.created_at,
      });
    }

    for (const p of posts) {
      cards.push({
        id: p.id,
        title: p.title,
        stage: p.pipeline_stage || 'scripting',
        source: 'scheduled_post',
        projectId: p.project_id,
        projectName: nameMap[p.project_id] || 'General',
        platform: p.platform,
        status: p.status,
        dueDate: p.scheduled_date || undefined,
        createdAt: p.created_at,
      });
    }

    return NextResponse.json({ cards, projectNames: nameMap });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, source, stage } = await req.json();
    if (!id || !source || !stage) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (source === 'todo') {
      await execute('UPDATE todos SET pipeline_stage = ?, updated_at = ? WHERE id = ?', [
        stage,
        new Date().toISOString(),
        id,
      ]);
    } else if (source === 'file_approval') {
      await execute('UPDATE file_approvals SET pipeline_stage = ?, updated_at = ? WHERE id = ?', [
        stage,
        new Date().toISOString(),
        id,
      ]);
    } else if (source === 'scheduled_post') {
      await execute('UPDATE scheduled_posts SET pipeline_stage = ?, updated_at = ? WHERE id = ?', [
        stage,
        new Date().toISOString(),
        id,
      ]);
    }

    // Log to audit_logs
    await execute(
      'INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        'log_' + Date.now(),
        user.organization_id || 'org_default',
        user.id,
        `Moved card to ${stage}`,
        source,
        id,
        new Date().toISOString(),
      ]
    );

    return NextResponse.json({ success: true, id, stage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
