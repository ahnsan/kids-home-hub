/**
 * Redeem points API handler
 */

import type { Context } from 'hono';
import type { Env, Variables, ApiResponse, RedeemResponse } from '../types';
import { TransactionService } from '../services/transaction-service';
import { redeemSchema, type RedeemInput } from '../schemas/validation';
import { Logger } from '../utils/logger';
import { asyncHandler } from '../utils/error-handler';

/**
 * Redeem points for screen time
 */
export const redeemHandler = asyncHandler(
  async (c: Context<{ Bindings: Env; Variables: Variables }>): Promise<Response> => {
    const logger = new Logger(c);
    logger.info('Processing points redemption');

    // Parse and validate request body
    const body = await c.req.json();
    const validated: RedeemInput = redeemSchema.parse(body);

    // Create transaction service
    const transactionService = new TransactionService(c.env.CHILD_SPEND);

    // Process redemption
    const result = await transactionService.redeemPoints(
      validated.child,
      validated.points,
      validated.reason
    );

    logger.info('Points redeemed successfully', {
      child: result.child,
      points: result.pointsSpent,
      minutes: result.minutesAdded,
    });

    // Build response
    const response: ApiResponse<RedeemResponse> = {
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
