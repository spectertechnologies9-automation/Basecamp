import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';
import type { ApiResponse } from '@/types';

/**
 * POST /api/ai/chat
 * Body: { message: string, context?: string, projectId?: string }
 */
export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json<ApiResponse>({
      data: { reply: "I am NexaFlow AI. Please configure GEMINI_API_KEY in your .env.local to activate real-time Gemini intelligence for project summaries and task drafting." }
    });
  }

  const body = await req.json();
  const { message, context, projectId } = body;
  if (!message?.trim()) return NextResponse.json<ApiResponse>({ error: 'message required' }, { status: 400 });

  let projectCtx = '';
  if (projectId) {
    const project = await queryOne<any>('SELECT name, description FROM projects WHERE id = ?', [projectId]);
    if (project) projectCtx = `\nProject context: "${project.name}" - ${project.description ?? 'No description'}`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const systemPrompt = `You are NexaFlow AI Assistant, a helpful project management assistant. 
You help users with task organization, project planning, writing, and productivity.
Be concise, friendly, and professional.${projectCtx}
${context ? `\nAdditional context: ${context}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: message }] }
      ],
      config: { systemInstruction: systemPrompt, maxOutputTokens: 1024 },
    });

    const text = response.text ?? '';
    return NextResponse.json<ApiResponse>({ data: { reply: text } });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message ?? 'AI request failed' }, { status: 500 });
  }
}
