/**
 * JWT utilities for authentication
 */

import * as jose from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  householdId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Parse expiration time to seconds
 */
function parseExpiresIn(expiresIn: string | number): number {
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match || !match[1]) {
    throw new Error('Invalid expiresIn format');
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: throw new Error('Invalid expiresIn unit');
  }
}

/**
 * Sign a JWT token
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresIn: string | number = '30d'): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  const expirationSeconds = parseExpiresIn(expiresIn);

  return await new jose.SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirationSeconds)
    .sign(secretKey);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);

    // Validate required fields
    if (!payload['userId'] || !payload['email']) {
      throw new Error('Invalid token payload');
    }

    return payload as unknown as JWTPayload;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      throw new Error('Token expired');
    }
    if (error instanceof jose.errors.JWTInvalid) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jose.decodeJwt(token);
    if (!decoded['userId'] || !decoded['email']) {
      return null;
    }
    return decoded as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined | null): string | null {
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] || null : null;
}
