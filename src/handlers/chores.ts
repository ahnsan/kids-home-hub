/**
 * Chores API handlers
 */

import type { Context } from 'hono';
import type { Env, Variables, ApiResponse, ChoresResponse, Chore } from '../types';
import { TransactionService } from '../services/transaction-service';
import { choresSchema, type ChoresInput } from '../schemas/validation';
import { Logger } from '../utils/logger';
import { asyncHandler } from '../utils/error-handler';

/**
 * Submit completed chores
 */
export const submitChoresHandler = asyncHandler(
  async (c: Context<{ Bindings: Env; Variables: Variables }>): Promise<Response> => {
    const logger = new Logger(c);
    logger.info('Processing chores submission');

    // Parse and validate request body
    const body = await c.req.json();
    const validated: ChoresInput = choresSchema.parse(body);

    // Create transaction service
    const transactionService = new TransactionService(c.env.CHILD_SPEND);

    // Process chores
    const result = await transactionService.processChores(
      validated.child,
      validated.chore
    );

    logger.info('Chores submitted successfully', {
      child: result.child,
      points: result.totalPoints,
      choresCount: result.choresCompleted.length,
    });

    // Build response
    const response: ApiResponse<ChoresResponse> = {
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
        requestId: c.get('requestId'),
      },
    };

    await logger.logMetrics(200);

    return c.json(response, 200);
  }
);

/**
 * Get available chores list
 */
export const getChoresHandler = asyncHandler(
  async (c: Context<{ Bindings: Env; Variables: Variables }>): Promise<Response> => {
    const logger = new Logger(c);
    logger.info('Fetching chores list');

    // Create transaction service
    const transactionService = new TransactionService(c.env.CHILD_SPEND);

    // Get chores
    const chores = transactionService.getChores();

    // Build response
    const response: ApiResponse<Chore[]> = {
      success: true,
      data: chores,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
        requestId: c.get('requestId'),
      },
    };

    await logger.logMetrics(200);

    return c.json(response, 200);
  }
);
