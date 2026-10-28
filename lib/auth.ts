import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const AUTH_COOKIE = 'pathpilot_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'pathpilot-dsa-secret-jwt-key-2026-super-secure-token-32b'
);

export interface TokenPayload {
  userId: string;
  email: string;
  name?: string | null;
  onboarded: boolean;
}

/**
 * Hash a plain password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare plain password against bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT token valid for 7 days
 */
export async function createSessionToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

/**
 * Verify and decode JWT token
 */
export async function verifySessionToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieve session user from HTTP request cookies
 */
export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      onboarded: true,
      weeklyStudyHours: true,
      targetGoalId: true,
      yearOfStudy: true,
      branch: true,
      createdAt: true,
    },
  });

  return user;
}

export { AUTH_COOKIE };
