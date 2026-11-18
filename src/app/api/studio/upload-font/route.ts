import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { getServerUser } from '@/lib/auth';
import { query, execute } from '@/lib/db';

export async function GET() {
  const fonts = await query<any>('SELECT * FROM custom_fonts ORDER BY created_at DESC');
  return NextResponse.json({ data: fonts });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fontFamily = (formData.get('fontFamily') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No font file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name).toLowerCase();
    if (!['.woff', '.woff2', '.ttf', '.otf'].includes(ext)) {
      return NextResponse.json(
        { error: 'Only .woff, .woff2, .ttf, or .otf font files are supported' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'fonts', 'custom');
    await fs.mkdir(uploadDir, { recursive: true });

    const cleanName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFileName = `${cleanName}_${Date.now()}${ext}`;
    const filePathOnDisk = path.join(uploadDir, safeFileName);
    const fileUrl = `/fonts/custom/${safeFileName}`;

    await fs.writeFile(filePathOnDisk, buffer);

    const id = `font_${crypto.randomBytes(8).toString('hex')}`;
    const name = fontFamily.trim() || cleanName;
    const now = new Date().toISOString();

    await execute(
      'INSERT INTO custom_fonts (id, name, file_url, font_family, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, fileUrl, name, now]
    );

    return NextResponse.json({
      data: {
        id,
        name,
        file_url: fileUrl,
        font_family: name,
        created_at: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Font upload failed' }, { status: 500 });
  }
}
