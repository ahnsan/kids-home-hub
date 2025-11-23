/**
 * Zod validation schemas for all API endpoints
 */

import { z } from 'zod';

// Child validation
export const childSchema = z.enum(['adam', 'sami'], {
  errorMap: () => ({ message: 'Child must be either "adam" or "sami"' }),
});

// Action validation
export const actionSchema = z.enum(['add', 'deduct'], {
  errorMap: () => ({ message: 'Action must be either "add" or "deduct"' }),
});

// Feature validation
export const featureSchema = z.enum(['money', 'points', 'screen'], {
  errorMap: () => ({ message: 'Feature must be "money", "points", or "screen"' }),
});

// Currency validation
export const currencySchema = z.enum(['GBP', 'AUD'], {
  errorMap: () => ({ message: 'Currency must be either "GBP" or "AUD"' }),
});

// Amount validations
export const moneyAmountSchema = z
  .number({
    required_error: 'Amount is required',
    invalid_type_error: 'Amount must be a number',
  })
  .positive('Amount must be positive')
  .finite('Amount must be finite')
  .max(10000, 'Amount cannot exceed £10,000');

export const pointsAmountSchema = z
  .number({
    required_error: 'Points amount is required',
    invalid_type_error: 'Points must be a number',
  })
  .int('Points must be an integer')
  .positive('Points must be positive')
  .max(10000, 'Points cannot exceed 10,000');

export const minutesAmountSchema = z
  .number({
    required_error: 'Minutes amount is required',
    invalid_type_error: 'Minutes must be a number',
  })
  .int('Minutes must be an integer')
  .positive('Minutes must be positive')
  .max(1440, 'Minutes cannot exceed 1440 (24 hours)');

// Reason validation
export const reasonSchema = z
  .string({
    required_error: 'Reason is required',
  })
  .trim()
  .min(1, 'Reason cannot be empty')
  .max(200, 'Reason cannot exceed 200 characters')
  .regex(/^[a-zA-Z0-9\s\-.,!?()]+$/, 'Reason contains invalid characters');

// Chore ID validation
export const choreIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[a-z_]+$/, 'Invalid chore ID format');

// Transaction request schema
export const transactionSchema = z.object({
  feature: featureSchema,
  child: childSchema,
  action: actionSchema,
  amount: z.number().positive().finite(),
  currency: currencySchema.optional(),
  reason: reasonSchema.optional(),
}).refine(
  (data) => {
    // Money transactions require currency and reason
    if (data.feature === 'money') {
      return data.currency !== undefined && data.reason !== undefined;
    }
    return true;
  },
  {
    message: 'Money transactions require currency and reason',
    path: ['currency'],
  }
).refine(
  (data) => {
    // Points and screen transactions require reason
    if (data.feature === 'points' || data.feature === 'screen') {
      return data.reason !== undefined;
    }
    return true;
  },
  {
    message: 'Points and screen transactions require a reason',
    path: ['reason'],
  }
).refine(
  (data) => {
    // Validate amount based on feature
    if (data.feature === 'money') {
      return data.amount <= 10000;
    } else if (data.feature === 'points') {
      return Number.isInteger(data.amount) && data.amount <= 10000;
    } else if (data.feature === 'screen') {
      return Number.isInteger(data.amount) && data.amount <= 1440;
    }
    return true;
  },
  {
    message: 'Invalid amount for the selected feature',
    path: ['amount'],
  }
);

// Chores request schema
export const choresSchema = z.object({
  child: childSchema,
  chore: z
    .array(choreIdSchema, {
      required_error: 'Chore list is required',
      invalid_type_error: 'Chore must be an array',
    })
    .min(1, 'At least one chore must be selected')
    .max(10, 'Cannot select more than 10 chores'),
});

// Redeem request schema
export const redeemSchema = z.object({
  child: childSchema,
  points: pointsAmountSchema,
  reason: reasonSchema,
});

// Query parameter schemas
export const paginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().positive().max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
});

export const childQuerySchema = z.object({
  child: childSchema.optional(),
});

// Type exports
export type TransactionInput = z.infer<typeof transactionSchema>;
export type ChoresInput = z.infer<typeof choresSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ChildQueryInput = z.infer<typeof childQuerySchema>;
