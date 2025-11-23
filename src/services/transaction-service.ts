/**
 * Business logic for transactions
 */

import type {
  Env,
  ChildId,
  Action,
  Currency,
  Feature,
  Chore,
  PointSource,
  TransactionResponse,
  ChoresResponse,
  RedeemResponse,
} from '../types';
import { DataService } from './data-service';
import { InsufficientBalanceError } from '../utils/error-handler';

// Static conversion rates
const CONVERSION_RATES: Record<Currency, number> = {
  GBP: 1,
  AUD: 0.56,
};

// Conversion rate: 1 point = 1 minute
const POINT_TO_MINUTES = 1;

// Available chores
const CHORES: Chore[] = [
  { id: 'tidy_room', label: 'Tidy bedroom', points: 10 },
  { id: 'homework', label: 'Finish homework', points: 8 },
  { id: 'set_table', label: 'Set / clear the table', points: 5 },
  { id: 'feed_pet', label: 'Feed pet / help pet', points: 6 },
  { id: 'help_laundry', label: 'Help with laundry', points: 7 },
];

export class TransactionService {
  private dataService: DataService;

  constructor(kv: KVNamespace) {
    this.dataService = new DataService(kv);
  }

  /**
   * Process a money transaction
   */
  async processMoney(
    child: ChildId,
    action: Action,
    rawAmount: number,
    currency: Currency,
    reason: string
  ): Promise<TransactionResponse> {
    const rate = CONVERSION_RATES[currency] || 1;
    const converted = parseFloat((rawAmount * rate).toFixed(2));

    // Get current total
    let total = await this.dataService.getMoneyTotal(child);

    // Check for sufficient balance on deduct
    if (action === 'deduct' && total < converted) {
      throw new InsufficientBalanceError(
        `Insufficient money balance. Current: £${total.toFixed(2)}, Required: £${converted.toFixed(2)}`
      );
    }

    // Update total
    total = action === 'add' ? total + converted : total - converted;
    await this.dataService.setMoneyTotal(child, total);

    // Add log entry
    await this.dataService.addMoneyLogEntry(child, {
      timestamp: new Date().toISOString(),
      action,
      rawAmount: rawAmount.toFixed(2),
      currency,
      converted: converted.toFixed(2),
      reason,
    });

    return {
      child,
      feature: 'money',
      newBalance: total.toFixed(2),
      transaction: {
        action,
        amount: converted,
        reason,
      },
    };
  }

  /**
   * Process a points transaction
   */
  async processPoints(
    child: ChildId,
    action: Action,
    amount: number,
    reason: string,
    source: PointSource = 'manual'
  ): Promise<TransactionResponse> {
    const delta = Math.round(amount);

    // Get current total
    let total = await this.dataService.getPointsTotal(child);

    // Check for sufficient balance on deduct
    if (action === 'deduct' && total < delta) {
      throw new InsufficientBalanceError(
        `Insufficient points balance. Current: ${total}, Required: ${delta}`
      );
    }

    // Update total
    total = action === 'add' ? total + delta : total - delta;
    await this.dataService.setPointsTotal(child, total);

    // Add log entry
    await this.dataService.addPointsLogEntry(child, {
      timestamp: new Date().toISOString(),
      action,
      amount: delta,
      reason,
      source,
    });

    return {
      child,
      feature: 'points',
      newBalance: total,
      transaction: {
        action,
        amount: delta,
        reason,
      },
    };
  }

  /**
   * Process a screen time transaction
   */
  async processScreen(
    child: ChildId,
    action: Action,
    rawAmount: number,
    reason: string
  ): Promise<TransactionResponse> {
    const minutes = Math.round(rawAmount);

    // Get current total
    let total = await this.dataService.getScreenTotal(child);

    // Check for sufficient balance on deduct
    if (action === 'deduct' && total < minutes) {
      throw new InsufficientBalanceError(
        `Insufficient screen time balance. Current: ${total} min, Required: ${minutes} min`
      );
    }

    // Update total
    total = action === 'add' ? total + minutes : total - minutes;
    await this.dataService.setScreenTotal(child, total);

    // Add log entry
    await this.dataService.addScreenLogEntry(child, {
      timestamp: new Date().toISOString(),
      action,
      minutes,
      reason,
    });

    return {
      child,
      feature: 'screen',
      newBalance: total,
      transaction: {
        action,
        amount: minutes,
        reason,
      },
    };
  }

  /**
   * Process chores completion
   */
  async processChores(child: ChildId, choreIds: string[]): Promise<ChoresResponse> {
    // Validate and get chore details
    const completed = CHORES.filter((c) => choreIds.includes(c.id));

    if (completed.length === 0) {
      throw new InsufficientBalanceError('No valid chores selected');
    }

    // Calculate total points
    const totalPoints = completed.reduce((sum, c) => sum + c.points, 0);
    const timestamp = new Date().toISOString();

    // Update points balance
    let pointsTotal = await this.dataService.getPointsTotal(child);
    pointsTotal += totalPoints;
    await this.dataService.setPointsTotal(child, pointsTotal);

    // Add points log entry
    const reason = 'Chores: ' + completed.map((c) => c.label).join(', ');
    await this.dataService.addPointsLogEntry(child, {
      timestamp,
      action: 'add',
      amount: totalPoints,
      reason,
      source: 'chores',
    });

    // Add chores log entry
    await this.dataService.addChoresLogEntry(child, {
      timestamp,
      items: completed,
    });

    return {
      child,
      totalPoints,
      choresCompleted: completed,
      newPointsBalance: pointsTotal,
    };
  }

  /**
   * Redeem points for screen time
   */
  async redeemPoints(child: ChildId, points: number, reason: string): Promise<RedeemResponse> {
    const timestamp = new Date().toISOString();

    // Get current points balance
    const currentPoints = await this.dataService.getPointsTotal(child);

    // Validate sufficient points
    if (currentPoints < points) {
      throw new InsufficientBalanceError(
        `Insufficient points. Current: ${currentPoints}, Required: ${points}`
      );
    }

    // Calculate minutes
    const minutes = points * POINT_TO_MINUTES;

    // Deduct points
    const newPointsBalance = currentPoints - points;
    await this.dataService.setPointsTotal(child, newPointsBalance);

    // Add points log entry
    await this.dataService.addPointsLogEntry(child, {
      timestamp,
      action: 'deduct',
      amount: points,
      reason: `${reason} (spent for screen time)`,
      source: 'redeem_to_screen',
    });

    // Add screen time
    const currentScreen = await this.dataService.getScreenTotal(child);
    const newScreenBalance = currentScreen + minutes;
    await this.dataService.setScreenTotal(child, newScreenBalance);

    // Add screen log entry
    await this.dataService.addScreenLogEntry(child, {
      timestamp,
      action: 'add',
      minutes,
      reason: `From points: ${points} pts → ${minutes} min (${reason})`,
    });

    return {
      child,
      pointsSpent: points,
      minutesAdded: minutes,
      newPointsBalance,
      newScreenBalance,
    };
  }

  /**
   * Get available chores
   */
  getChores(): Chore[] {
    return CHORES;
  }
}
