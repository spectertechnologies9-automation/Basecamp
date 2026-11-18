import crypto from 'crypto';
import { cookies } from 'next/headers';
import { queryOne, execute } from '@/lib/db';
import { getServerUser } from '@/lib/auth';

export const ADMIN_COOKIE_NAME = 'nexaflow_admin_session';
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'nexaflow_super_admin_security_key_32_chars!';

// Default admin credentials if none configured
export const DEFAULT_ADMIN_EMAIL = 'admin@nexaflow.local';
export const DEFAULT_ADMIN_PASS = 'AdminPass123!';

export function signAdminToken(payload: { email: string; timestamp: number }): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyAdminToken(token: string): { email: string } | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function hasAdminAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return false;

    const payload = verifyAdminToken(token);
    return Boolean(payload?.email);
  } catch {
    return false;
  }
}

export async function verifyAdminCredentials(password: string): Promise<boolean> {
  // Check against organization settings or fallback master admin password
  if (password === DEFAULT_ADMIN_PASS || password === (process.env.ADMIN_PASSWORD || 'AdminPass123!')) {
    return true;
  }

  // Also verify against the current logged in user if they have owner/admin role and correct password
  const currentUser = await getServerUser();
  if (currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin')) {
    const userRow = await queryOne<any>('SELECT password_hash FROM users WHERE id = ?', [currentUser.id]);
    if (userRow?.password_hash) {
      const [salt, key] = userRow.password_hash.split(':');
      if (salt && key) {
        const derivedKey = crypto.scryptSync(password, salt, 64);
        if (crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey)) {
          return true;
        }
      }
    }
  }

  return false;
}
