import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
import { canManageOrganization } from '@/lib/permissions';
import type { UserRole, ApiResponse } from '@/types';

function maskKey(key?: string): string {
  if (!key || key.length < 8) return '';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = canManageOrganization(user.role as UserRole);
  if (!isAdmin) {
    return NextResponse.json<ApiResponse>({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const row = await queryOne<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['ai_config']);
    const config = row?.value ? JSON.parse(row.value) : {};

    return NextResponse.json({
      data: {
        provider: config.provider || 'gemini',
        default_model: config.default_model || 'gemini-2.0-flash',
        omni_key: maskKey(config.omni_key || process.env.OPENROUTER_API_KEY || process.env.OMNI_ROUTE_API_KEY),
        grok_key: maskKey(config.grok_key || process.env.XAI_API_KEY),
        qwen_key: maskKey(config.qwen_key || process.env.DASHSCOPE_API_KEY),
        gemini_key: maskKey(config.gemini_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY),
        has_omni: !!(config.omni_key || process.env.OPENROUTER_API_KEY || process.env.OMNI_ROUTE_API_KEY),
        has_grok: !!(config.grok_key || process.env.XAI_API_KEY),
        has_qwen: !!(config.qwen_key || process.env.DASHSCOPE_API_KEY),
        has_gemini: !!(config.gemini_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY),
      },
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) return NextResponse.json<ApiResponse>({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = canManageOrganization(user.role as UserRole);
  if (!isAdmin) {
    return NextResponse.json<ApiResponse>({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const existingRow = await queryOne<{ value: string }>('SELECT value FROM system_settings WHERE key = ?', ['ai_config']);
    const existingConfig = existingRow?.value ? JSON.parse(existingRow.value) : {};

    const updatedConfig = {
      ...existingConfig,
      provider: body.provider || existingConfig.provider || 'gemini',
      default_model: body.default_model || existingConfig.default_model || 'gemini-2.0-flash',
      omni_key: body.omni_key && !body.omni_key.includes('...') ? body.omni_key.trim() : existingConfig.omni_key,
      grok_key: body.grok_key && !body.grok_key.includes('...') ? body.grok_key.trim() : existingConfig.grok_key,
      qwen_key: body.qwen_key && !body.qwen_key.includes('...') ? body.qwen_key.trim() : existingConfig.qwen_key,
      gemini_key: body.gemini_key && !body.gemini_key.includes('...') ? body.gemini_key.trim() : existingConfig.gemini_key,
    };

    const now = new Date().toISOString();
    await execute(
      'INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      ['ai_config', JSON.stringify(updatedConfig), now]
    );

    return NextResponse.json({
      message: 'AI Configuration successfully saved',
      data: {
        provider: updatedConfig.provider,
        default_model: updatedConfig.default_model,
        has_omni: !!updatedConfig.omni_key,
        has_grok: !!updatedConfig.grok_key,
        has_qwen: !!updatedConfig.qwen_key,
        has_gemini: !!updatedConfig.gemini_key,
      },
    });
  } catch (err: any) {
    return NextResponse.json<ApiResponse>({ error: err.message }, { status: 500 });
  }
}
