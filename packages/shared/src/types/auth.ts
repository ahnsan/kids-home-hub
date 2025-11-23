/**
 * Authentication types
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  householdId?: string;
  createdAt: number;
  lastLoginAt: number;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export interface MagicLinkRequest {
  email: string;
  redirectUrl?: string;
}

export interface MagicLinkVerification {
  token: string;
  email: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export interface Household {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  members: string[]; // user IDs
}
