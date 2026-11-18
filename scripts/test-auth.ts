import { hashPassword, verifyPassword, signToken, verifyToken, signupUser, loginUser } from '../src/lib/auth/local';

async function main() {
  const hash = hashPassword('Secret123!');
  console.log('PASS_VERIFY_OK:', verifyPassword('Secret123!', hash));
  console.log('PASS_VERIFY_WRONG:', verifyPassword('Wrong!', hash));

  const token = signToken({ userId: 'user_abc', email: 'test@nexaflow.com' });
  const payload = verifyToken<{ userId: string; email: string }>(token);
  console.log('TOKEN_VERIFY_OK:', payload?.userId === 'user_abc' && payload?.email === 'test@nexaflow.com');

  // Test creating a local user
  const email = `admin_${Date.now()}@nexaflow.com`;
  const created = await signupUser(email, 'TestPassword123!', 'Lead Architect');
  console.log('SIGNUP_USER:', created.id, created.email, created.role);

  // Test logging in with correct credentials
  const loggedIn = await loginUser(email, 'TestPassword123!');
  console.log('LOGIN_OK:', !!loggedIn && loggedIn.email === email);

  // Test logging in with invalid credentials
  const badLogin = await loginUser(email, 'WrongPassword!');
  console.log('LOGIN_BAD_REJECTED:', badLogin === null);
}

main().catch(console.error);
