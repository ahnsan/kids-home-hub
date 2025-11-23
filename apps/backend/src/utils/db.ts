/**
 * Database connection utility for Neon PostgreSQL
 */

import { neon, neonConfig } from '@neondatabase/serverless';

// Enable connection pooling for better performance
neonConfig.fetchConnectionCache = true;

export type DatabaseConnection = ReturnType<typeof neon>;

/**
 * Create database connection from environment
 */
export function createDbConnection(databaseUrl: string): DatabaseConnection {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return neon(databaseUrl);
}

/**
 * Set user context for Row Level Security
 */
export async function setUserContext(
  sql: DatabaseConnection,
  userId: string
): Promise<void> {
  await sql`SELECT set_config('app.current_user_id', ${userId}, false)`;
}

/**
 * Clear user context
 */
export async function clearUserContext(sql: DatabaseConnection): Promise<void> {
  await sql`SELECT set_config('app.current_user_id', '', false)`;
}

/**
 * Execute query within user context
 */
export async function withUserContext<T>(
  sql: DatabaseConnection,
  userId: string,
  callback: () => Promise<T>
): Promise<T> {
  try {
    await setUserContext(sql, userId);
    return await callback();
  } finally {
    await clearUserContext(sql);
  }
}

/**
 * Format database error for API response
 */
export function formatDbError(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    // PostgreSQL error
    if ('code' in error) {
      return {
        message: error.message,
        code: (error as any).code,
      };
    }
    return { message: error.message };
  }
  return { message: 'Database error occurred' };
}
