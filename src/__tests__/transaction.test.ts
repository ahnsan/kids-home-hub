/**
 * Unit tests for transaction handlers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { transactionSchema } from '../schemas/validation';
import { TransactionService } from '../services/transaction-service';

describe('Transaction Schema Validation', () => {
  it('should validate a valid money transaction', () => {
    const input = {
      feature: 'money' as const,
      child: 'adam' as const,
      action: 'add' as const,
      amount: 10.50,
      currency: 'GBP' as const,
      reason: 'Birthday gift',
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject money transaction without currency', () => {
    const input = {
      feature: 'money' as const,
      child: 'adam' as const,
      action: 'add' as const,
      amount: 10.50,
      reason: 'Birthday gift',
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject money transaction without reason', () => {
    const input = {
      feature: 'money' as const,
      child: 'adam' as const,
      action: 'add' as const,
      amount: 10.50,
      currency: 'GBP' as const,
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should validate a valid points transaction', () => {
    const input = {
      feature: 'points' as const,
      child: 'sami' as const,
      action: 'add' as const,
      amount: 15,
      reason: 'Good behavior',
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid child name', () => {
    const input = {
      feature: 'points' as const,
      child: 'invalid',
      action: 'add' as const,
      amount: 15,
      reason: 'Good behavior',
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const input = {
      feature: 'points' as const,
      child: 'adam' as const,
      action: 'add' as const,
      amount: -10,
      reason: 'Test',
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject invalid action', () => {
    const input = {
      feature: 'points' as const,
      child: 'adam' as const,
      action: 'invalid',
      amount: 10,
      reason: 'Test',
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject amount exceeding limits', () => {
    const input = {
      feature: 'money' as const,
      child: 'adam' as const,
      action: 'add' as const,
      amount: 20000,
      currency: 'GBP' as const,
      reason: 'Test',
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject screen time exceeding 24 hours', () => {
    const input = {
      feature: 'screen' as const,
      child: 'adam' as const,
      action: 'add' as const,
      amount: 2000, // More than 1440 minutes
      reason: 'Test',
    };

    const result = transactionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('Transaction Service - Money', () => {
  let mockKV: any;
  let service: TransactionService;

  beforeEach(() => {
    // Mock KV namespace
    const store = new Map<string, string>();
    mockKV = {
      get: async (key: string) => store.get(key) || null,
      put: async (key: string, value: string) => {
        store.set(key, value);
      },
    };

    service = new TransactionService(mockKV as KVNamespace);
  });

  it('should process money addition correctly', async () => {
    const result = await service.processMoney('adam', 'add', 10, 'GBP', 'Test');

    expect(result.child).toBe('adam');
    expect(result.feature).toBe('money');
    expect(result.newBalance).toBe('10.00');
    expect(result.transaction.amount).toBe(10);
  });

  it('should convert AUD to GBP correctly', async () => {
    const result = await service.processMoney('adam', 'add', 100, 'AUD', 'Test');

    // 100 AUD * 0.56 = 56 GBP
    expect(result.newBalance).toBe('56.00');
  });

  it('should throw error on insufficient balance for deduction', async () => {
    await expect(
      service.processMoney('adam', 'deduct', 50, 'GBP', 'Test')
    ).rejects.toThrow('Insufficient money balance');
  });
});

describe('Transaction Service - Points', () => {
  let mockKV: any;
  let service: TransactionService;

  beforeEach(() => {
    const store = new Map<string, string>();
    mockKV = {
      get: async (key: string) => store.get(key) || null,
      put: async (key: string, value: string) => {
        store.set(key, value);
      },
    };

    service = new TransactionService(mockKV as KVNamespace);
  });

  it('should process points addition correctly', async () => {
    const result = await service.processPoints('sami', 'add', 25, 'Homework completed');

    expect(result.child).toBe('sami');
    expect(result.feature).toBe('points');
    expect(result.newBalance).toBe(25);
  });

  it('should round points to nearest integer', async () => {
    const result = await service.processPoints('sami', 'add', 25.7, 'Test');

    expect(result.transaction.amount).toBe(26);
    expect(result.newBalance).toBe(26);
  });

  it('should throw error on insufficient points for deduction', async () => {
    await expect(
      service.processPoints('sami', 'deduct', 50, 'Test')
    ).rejects.toThrow('Insufficient points balance');
  });
});

describe('Transaction Service - Chores', () => {
  let mockKV: any;
  let service: TransactionService;

  beforeEach(() => {
    const store = new Map<string, string>();
    mockKV = {
      get: async (key: string) => store.get(key) || null,
      put: async (key: string, value: string) => {
        store.set(key, value);
      },
    };

    service = new TransactionService(mockKV as KVNamespace);
  });

  it('should process chores correctly', async () => {
    const result = await service.processChores('adam', ['tidy_room', 'homework']);

    expect(result.child).toBe('adam');
    expect(result.totalPoints).toBe(18); // 10 + 8
    expect(result.choresCompleted).toHaveLength(2);
  });

  it('should ignore invalid chore IDs', async () => {
    const result = await service.processChores('adam', ['tidy_room', 'invalid_chore']);

    expect(result.totalPoints).toBe(10); // Only tidy_room
    expect(result.choresCompleted).toHaveLength(1);
  });

  it('should throw error when no valid chores', async () => {
    await expect(
      service.processChores('adam', ['invalid1', 'invalid2'])
    ).rejects.toThrow('No valid chores selected');
  });
});

describe('Transaction Service - Redeem', () => {
  let mockKV: any;
  let service: TransactionService;

  beforeEach(() => {
    const store = new Map<string, string>();
    // Set initial points
    store.set('points:total:adam', '50');

    mockKV = {
      get: async (key: string) => store.get(key) || null,
      put: async (key: string, value: string) => {
        store.set(key, value);
      },
    };

    service = new TransactionService(mockKV as KVNamespace);
  });

  it('should redeem points for screen time correctly', async () => {
    const result = await service.redeemPoints('adam', 20, 'Movie night');

    expect(result.child).toBe('adam');
    expect(result.pointsSpent).toBe(20);
    expect(result.minutesAdded).toBe(20); // 1:1 ratio
    expect(result.newPointsBalance).toBe(30);
  });

  it('should throw error on insufficient points', async () => {
    await expect(
      service.redeemPoints('adam', 100, 'Test')
    ).rejects.toThrow('Insufficient points');
  });
});
