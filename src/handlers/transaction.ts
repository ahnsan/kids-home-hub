/**
 * Transaction API handlers
 */

import type { Context } from 'hono';
import type { Env, Variables, ApiResponse, TransactionResponse } from '../types';
import { TransactionService } from '../services/transaction-service';
import { transactionSchema, type TransactionInput } from '../schemas/validation';
import { Logger } from '../utils/logger';
import { asyncHandler } from '../utils/error-handler';

export const transactionHandler = asyncHandler(
  async (c: Context<{ Bindings: Env; Variables: Variables }>): Promise<Response> => {
    const logger = new Logger(c);
    logger.info('Processing transaction request');

    // Parse and validate request body
    const body = await c.req.json();
    const validated: TransactionInput = transactionSchema.parse(body);

    // Create transaction service
    const transactionService = new TransactionService(c.env.CHILD_SPEND);

    let result: TransactionResponse;

    // Process based on feature type
    if (validated.feature === 'money') {
      if (!validated.currency || !validated.reason) {
        throw new Error('Currency and reason required for money transactions');
      }

      result = await transactionService.processMoney(
        validated.child,
        validated.action,
        validated.amount,
        validated.currency,
        validated.reason
      );
    } else if (validated.feature === 'points') {
      if (!validated.reason) {
        throw new Error('Reason required for points transactions');
      }

      result = await transactionService.processPoints(
        validated.child,
        validated.action,
        validated.amount,
        validated.reason
      );
    } else if (validated.feature === 'screen') {
      if (!validated.reason) {
        throw new Error('Reason required for screen time transactions');
      }

      result = await transactionService.processScreen(
        validated.child,
        validated.action,
        validated.amount,
        validated.reason
      );
    } else {
      throw new Error('Invalid feature type');
    }

    logger.info('Transaction completed successfully', { result });

    // Build response
    const response: ApiResponse<TransactionResponse> = {
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
