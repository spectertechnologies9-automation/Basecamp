import crypto from 'crypto';
import { cookies } from 'next/headers';
import { queryOne, execute } from '@/lib/db';
import type { User } from '@/types';

const SESSION_COOKIE_NAME = 'nexaflow_session';
const SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'nexaflow_local_dev_secret_key_32_characters_minimum!';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken<T = any>(token: string): T | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export async function signupUser(email: string, password: string, fullName: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing) {
    throw new Error('A user with this email address already exists.');
  }

  const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);

  // First user created becomes the organization owner; new registrations have 'role_not_assigned' until an admin assigns a role
  const countRow = await queryOne<{ total: number }>('SELECT count(*) as total FROM users');
  const isFirstUser = (countRow?.total ?? 0) === 0;
  const role = isFirstUser ? 'owner' : 'role_not_assigned';

  await execute(
    `INSERT INTO users (
      id, organization_id, email, password_hash, full_name, role, timezone, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [userId, 'org_default', normalizedEmail, passwordHash, fullName.trim(), role, 'Asia/Kolkata', now, now]
  );

  await execute(
    'INSERT OR REPLACE INTO organization_members (id, organization_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)',
    [`mem_${crypto.randomBytes(8).toString('hex')}`, 'org_default', userId, role, now]
  );

  const user = await queryOne<User>(
    'SELECT id, organization_id, email, full_name, role, timezone, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ?',
    [userId]
  );

  return user!;
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const row = await queryOne<any>(
    'SELECT * FROM users WHERE email = ? AND is_active = 1',
    [normalizedEmail]
  );

  if (!row) return null;
  const isValid = verifyPassword(password, row.password_hash);
  if (!isValid) return null;

  const now = new Date().toISOString();
  await execute('UPDATE users SET last_seen_at = ?, updated_at = ? WHERE id = ?', [now, now, row.id]);

  const { password_hash, ...user } = row;
  return user as User;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken<{ userId: string }>(token);
    if (!payload?.userId) return null;

    const user = await queryOne<User>(
      'SELECT id, organization_id, email, full_name, role, timezone, avatar_url, is_active, created_at, updated_at FROM users WHERE id = ? AND is_active = 1',
      [payload.userId]
    );

    return user;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
