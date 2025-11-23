/**
 * Data retrieval API handler
 */

import type { Context } from 'hono';
import type { Env, Variables, ApiResponse, DataResponse, ChildId } from '../types';
import { DataService } from '../services/data-service';
import { childQuerySchema } from '../schemas/validation';
import { Logger } from '../utils/logger';
import { asyncHandler } from '../utils/error-handler';

// Conversion rates for display
const CONVERSION_RATES = { GBP: 1, AUD: 0.56 };

/**
 * Get all data for one or all children
 */
export const getDataHandler = asyncHandler(
  async (c: Context<{ Bindings: Env; Variables: Variables }>): Promise<Response> => {
    const logger = new Logger(c);
    logger.info('Fetching data');

    // Parse query parameters
    const query = childQuerySchema.parse({
      child: c.req.query('child'),
    });

    // Create data service
    const dataService = new DataService(c.env.CHILD_SPEND);

    // Determine which children to fetch
    const children: ChildId[] = query.child ? [query.child] : ['adam', 'sami'];

    // Fetch data for all children in parallel
    const dataPromises = children.map(async (child) => {
      const data = await dataService.getAllChildData(child);

      // Add AUD conversion for money
      const totalAUD = (data.money.total / CONVERSION_RATES.AUD).toFixed(2);

      return {
        child,
        data: {
          money: {
            total: data.money.total.toFixed(2),
            totalAUD,
            log: data.money.log,
          },
          points: data.points,
          screen: data.screen,
          chores: data.chores,
        },
      };
    });

    const results = await Promise.all(dataPromises);

    // Build response object
    const responseData: DataResponse = {
      children: results.reduce((acc, { child, data }) => {
        acc[child] = data;
        return acc;
      }, {} as DataResponse['children']),
    };

    logger.info('Data fetched successfully', {
      childrenCount: children.length,
    });

    // Build response
    const response: ApiResponse<DataResponse> = {
      success: true,
      data: responseData,
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
