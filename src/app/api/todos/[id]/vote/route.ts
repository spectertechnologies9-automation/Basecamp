import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todo = await queryOne<any>('SELECT * FROM todos WHERE id = ?', [params.id]);
  if (!todo) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Voting is ONLY allowed when the task is in the 'completed' / 'done' state
  if (todo.status !== 'completed' && todo.status !== 'done') {
    return NextResponse.json(
      { error: 'Members can only vote on tasks that are in the Done state' },
      { status: 400 }
    );
  }

  let votesList: string[] = [];
  try {
    if (todo.votes) {
      votesList = JSON.parse(todo.votes);
    }
  } catch {
    votesList = [];
  }

  const hasVoted = votesList.includes(user.id);
  if (hasVoted) {
    // Remove vote (toggle)
    votesList = votesList.filter((uid) => uid !== user.id);
  } else {
    votesList.push(user.id);
  }

  const newCount = votesList.length;
  await execute(
    'UPDATE todos SET votes = ?, vote_count = ?, updated_at = ? WHERE id = ?',
    [JSON.stringify(votesList), newCount, new Date().toISOString(), params.id]
  );

  return NextResponse.json({
    success: true,
    has_voted: !hasVoted,
    vote_count: newCount,
    votes: votesList,
  });
}
