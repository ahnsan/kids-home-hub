/**
 * Data service layer for KV operations
 * All KV interactions go through this service for consistency and error handling
 */

import type {
  Env,
  ChildId,
  MoneyLogEntry,
  PointsLogEntry,
  ScreenLogEntry,
  ChoresLogEntry,
  Chore,
} from '../types';
import { AppError } from '../utils/error-handler';
import { withTimeout } from '../utils/error-handler';

export class DataService {
  constructor(private kv: KVNamespace) {}

  /**
   * Get value from KV with timeout protection
   */
  private async get(key: string): Promise<string | null> {
    return withTimeout(
      this.kv.get(key),
      5000,
      `KV get operation timeout for key: ${key}`
    );
  }

  /**
   * Put value to KV with timeout protection
   */
  private async put(
    key: string,
    value: string,
    options?: KVNamespacePutOptions
  ): Promise<void> {
    return withTimeout(
      this.kv.put(key, value, options),
      5000,
      `KV put operation timeout for key: ${key}`
    );
  }

  // ========== MONEY OPERATIONS ==========

  async getMoneyTotal(child: ChildId): Promise<number> {
    try {
      const value = await this.get(`total_${child}`);
      return parseFloat(value || '0');
    } catch (error) {
      throw new AppError(
        `Failed to get money total for ${child}`,
        500,
        'KV_READ_ERROR',
        { child, error }
      );
    }
  }

  async setMoneyTotal(child: ChildId, amount: number): Promise<void> {
    try {
      await this.put(`total_${child}`, amount.toFixed(2));
    } catch (error) {
      throw new AppError(
        `Failed to set money total for ${child}`,
        500,
        'KV_WRITE_ERROR',
        { child, amount, error }
      );
    }
  }

  async getMoneyLog(child: ChildId): Promise<MoneyLogEntry[]> {
    try {
      const value = await this.get(`log_${child}`);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      throw new AppError(
        `Failed to get money log for ${child}`,
        500,
        'KV_READ_ERROR',
        { child, error }
      );
    }
  }

  async addMoneyLogEntry(child: ChildId, entry: MoneyLogEntry): Promise<void> {
    try {
      const log = await this.getMoneyLog(child);
      log.unshift(entry);
      // Keep only last 100 entries
      const trimmed = log.slice(0, 100);
      await this.put(`log_${child}`, JSON.stringify(trimmed));
    } catch (error) {
      throw new AppError(
        `Failed to add money log entry for ${child}`,
        500,
        'KV_WRITE_ERROR',
        { child, entry, error }
      );
    }
  }

  // ========== POINTS OPERATIONS ==========

  async getPointsTotal(child: ChildId): Promise<number> {
    try {
      const value = await this.get(`points:total:${child}`);
      return parseInt(value || '0', 10);
    } catch (error) {
      throw new AppError(
        `Failed to get points total for ${child}`,
        500,
        'KV_READ_ERROR',
        { child, error }
      );
    }
  }

  async setPointsTotal(child: ChildId, points: number): Promise<void> {
    try {
      await this.put(`points:total:${child}`, String(points));
    } catch (error) {
      throw new AppError(
        `Failed to set points total for ${child}`,
        500,
        'KV_WRITE_ERROR',
        { child, points, error }
      );
    }
  }

  async getPointsLog(child: ChildId): Promise<PointsLogEntry[]> {
    try {
      const value = await this.get(`points:log:${child}`);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      throw new AppError(
        `Failed to get points log for ${child}`,
        500,
        'KV_READ_ERROR',
        { child, error }
      );
    }
  }

  async addPointsLogEntry(child: ChildId, entry: PointsLogEntry): Promise<void> {
    try {
      const log = await this.getPointsLog(child);
      log.unshift(entry);
      // Keep only last 100 entries
      const trimmed = log.slice(0, 100);
      await this.put(`points:log:${child}`, JSON.stringify(trimmed));
    } catch (error) {
      throw new AppError(
        `Failed to add points log entry for ${child}`,
        500,
        'KV_WRITE_ERROR',
        { child, entry, error }
      );
    }
  }

  // ========== SCREEN TIME OPERATIONS ==========

  async getScreenTotal(child: ChildId): Promise<number> {
    try {
      const value = await this.get(`screen:total:${child}`);
      return parseInt(value || '0', 10);
    } catch (error) {
      throw new AppError(
        `Failed to get screen time total for ${child}`,
        500,
        'KV_READ_ERROR',
        { child, error }
      );
    }
  }

  async setScreenTotal(child: ChildId, minutes: number): Promise<void> {
    try {
      await this.put(`screen:total:${child}`, String(minutes));
    } catch (error) {
      throw new AppError(
        `Failed to set screen time total for ${child}`,
        500,
        'KV_WRITE_ERROR',
        { child, minutes, error }
      );
    }
  }

  async getScreenLog(child: ChildId): Promise<ScreenLogEntry[]> {
    try {
      const value = await this.get(`screen:log:${child}`);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      throw new AppError(
        `Failed to get screen time log for ${child}`,
        500,
        'KV_READ_ERROR',
        { child, error }
      );
    }
  }

  async addScreenLogEntry(child: ChildId, entry: ScreenLogEntry): Promise<void> {
    try {
      const log = await this.getScreenLog(child);
      log.unshift(entry);
      // Keep only last 100 entries
      const trimmed = log.slice(0, 100);
      await this.put(`screen:log:${child}`, JSON.stringify(trimmed));
    } catch (error) {
      throw new AppError(
        `Failed to add screen time log entry for ${child}`,
        500,
        'KV_WRITE_ERROR',
        { child, entry, error }
      );
    }
  }

  // ========== CHORES OPERATIONS ==========

  async getChoresLog(child: ChildId): Promise<ChoresLogEntry[]> {
    try {
      const value = await this.get(`chores:log:${child}`);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      throw new AppError(
        `Failed to get chores log for ${child}`,
        500,
        'KV_READ_ERROR',
        { child, error }
      );
    }
  }

  async addChoresLogEntry(child: ChildId, entry: ChoresLogEntry): Promise<void> {
    try {
      const log = await this.getChoresLog(child);
      log.unshift(entry);
      // Keep only last 50 entries
      const trimmed = log.slice(0, 50);
      await this.put(`chores:log:${child}`, JSON.stringify(trimmed));
    } catch (error) {
      throw new AppError(
        `Failed to add chores log entry for ${child}`,
        500,
        'KV_WRITE_ERROR',
        { child, entry, error }
      );
    }
  }

  // ========== BATCH OPERATIONS ==========

  /**
   * Get all data for a child (optimized with Promise.all)
   */
  async getAllChildData(child: ChildId): Promise<{
    money: { total: number; log: MoneyLogEntry[] };
    points: { total: number; log: PointsLogEntry[] };
    screen: { total: number; log: ScreenLogEntry[] };
    chores: { log: ChoresLogEntry[] };
  }> {
    try {
      const [moneyTotal, moneyLog, pointsTotal, pointsLog, screenTotal, screenLog, choresLog] =
        await Promise.all([
          this.getMoneyTotal(child),
          this.getMoneyLog(child),
          this.getPointsTotal(child),
          this.getPointsLog(child),
          this.getScreenTotal(child),
          this.getScreenLog(child),
          this.getChoresLog(child),
        ]);

      return {
        money: { total: moneyTotal, log: moneyLog },
        points: { total: pointsTotal, log: pointsLog },
        screen: { total: screenTotal, log: screenLog },
        chores: { log: choresLog },
      };
    } catch (error) {
      throw new AppError(
        `Failed to get all data for ${child}`,
        500,
        'KV_READ_ERROR',
        { child, error }
      );
    }
  }
}
