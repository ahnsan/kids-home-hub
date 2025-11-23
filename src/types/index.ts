/**
 * Type definitions for Kids Home Hub API
 */

// Environment bindings
export interface Env {
  CHILD_SPEND: KVNamespace;
  ENVIRONMENT?: string;
}

// Children identifiers
export type ChildId = 'adam' | 'sami';

// Feature types
export type Feature = 'money' | 'points' | 'screen';

// Transaction actions
export type Action = 'add' | 'deduct';

// Currencies
export type Currency = 'GBP' | 'AUD';

// Sources for points
export type PointSource = 'manual' | 'chores' | 'redeem_to_screen';

// Chore definition
export interface Chore {
  id: string;
  label: string;
  points: number;
}

// Money transaction log entry
export interface MoneyLogEntry {
  timestamp: string;
  action: Action;
  rawAmount: string;
  currency: Currency;
  converted: string;
  reason: string;
}

// Points transaction log entry
export interface PointsLogEntry {
  timestamp: string;
  action: Action;
  amount: number;
  reason: string;
  source: PointSource;
}

// Screen time log entry
export interface ScreenLogEntry {
  timestamp: string;
  action: Action;
  minutes: number;
  reason: string;
}

// Chores log entry
export interface ChoresLogEntry {
  timestamp: string;
  items: Chore[];
}

// API Request types
export interface TransactionRequest {
  feature: Feature;
  child: ChildId;
  action: Action;
  amount: number;
  currency?: Currency;
  reason?: string;
}

export interface ChoresRequest {
  child: ChildId;
  chore: string[];
}

export interface RedeemRequest {
  child: ChildId;
  points: number;
  reason: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export interface TransactionResponse {
  child: ChildId;
  feature: Feature;
  newBalance: number | string;
  transaction: {
    action: Action;
    amount: number;
    reason?: string;
  };
}

export interface ChoresResponse {
  child: ChildId;
  totalPoints: number;
  choresCompleted: Chore[];
  newPointsBalance: number;
}

export interface RedeemResponse {
  child: ChildId;
  pointsSpent: number;
  minutesAdded: number;
  newPointsBalance: number;
  newScreenBalance: number;
}

export interface DataResponse {
  children: {
    [key in ChildId]: {
      money: {
        total: string;
        totalAUD: string;
        log: MoneyLogEntry[];
      };
      points: {
        total: number;
        log: PointsLogEntry[];
      };
      screen: {
        total: number;
        log: ScreenLogEntry[];
      };
      chores: {
        log: ChoresLogEntry[];
      };
    };
  };
}

// Rate limiting
export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Monitoring types
export interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export interface ErrorLog {
  message: string;
  stack?: string;
  path: string;
  method: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
}

// Context type for Hono
export interface Variables {
  requestId: string;
  startTime: number;
  ip: string;
}
