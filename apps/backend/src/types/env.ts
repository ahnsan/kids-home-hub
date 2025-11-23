/**
 * Environment bindings for Cloudflare Workers
 */

export interface Env {
  // Secrets
  DATABASE_URL: string;
  JWT_SECRET: string;
  MAGIC_LINK_SECRET: string;
  RESEND_API_KEY: string;

  // Variables
  ENVIRONMENT?: 'production' | 'staging' | 'development';
}
