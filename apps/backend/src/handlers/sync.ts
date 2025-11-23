/**
 * Sync handler for multi-device synchronization
 */

import type { Context } from 'hono';
import type { Env } from '../types/env';
import { createDbConnection } from '../utils/db';

interface SyncRequest {
  lastSyncedAt?: string;
  changes?: {
    children?: Array<{
      id: string;
      action: 'create' | 'update' | 'delete';
      data?: any;
    }>;
    chores?: Array<{
      id: string;
      action: 'create' | 'update' | 'delete';
      data?: any;
    }>;
    transactions?: Array<{
      childId: string;
      type: string;
      action: string;
      amount: number;
      currency?: string;
      reason?: string;
    }>;
    choreCompletions?: Array<{
      childId: string;
      choreId: string;
      completedAt: string;
    }>;
  };
}

/**
 * POST /v1/sync
 * Synchronize data across devices
 */
export async function sync(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const body: SyncRequest = await c.req.json();
    const { lastSyncedAt, changes } = body;

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Get user's household(s)
    const households = await sql`
      SELECT h.id
      FROM households h
      WHERE h.owner_id = ${user.userId}
         OR h.id IN (
           SELECT household_id FROM household_members WHERE user_id = ${user.userId}
         )
    ` as any[];

    if (households.length === 0) {
      return c.json({
        serverTime: new Date().toISOString(),
        changes: {},
      });
    }

    const householdIds = households.map((h: any) => h.id);

    // Process incoming changes from client
    if (changes) {
      await processClientChanges(sql, user.userId, householdIds, changes);
    }

    // Get changes from server since lastSyncedAt
    const serverChanges: any = {};

    // Only fetch changes if lastSyncedAt is provided
    if (lastSyncedAt) {
      const syncTime = new Date(lastSyncedAt);

      // Get updated children
      serverChanges.children = await sql`
        SELECT id, household_id, name, avatar, money_total, points_total, screen_total, display_order, created_at, updated_at
        FROM children
        WHERE household_id = ANY(${householdIds})
          AND updated_at > ${syncTime}
        ORDER BY updated_at
      `;

      // Get updated chores
      serverChanges.chores = await sql`
        SELECT id, household_id, label, points, icon, category, is_default, created_at, updated_at
        FROM chores
        WHERE household_id = ANY(${householdIds})
          AND updated_at > ${syncTime}
        ORDER BY updated_at
      `;

      // Get new transactions
      serverChanges.transactions = await sql`
        SELECT t.*
        FROM transactions t
        JOIN children c ON c.id = t.child_id
        WHERE c.household_id = ANY(${householdIds})
          AND t.created_at > ${syncTime}
        ORDER BY t.created_at
        LIMIT 100
      `;

      // Get new chore completions
      serverChanges.choreCompletions = await sql`
        SELECT cc.*
        FROM chore_completions cc
        JOIN children c ON c.id = cc.child_id
        WHERE c.household_id = ANY(${householdIds})
          AND cc.completed_at > ${syncTime}
        ORDER BY cc.completed_at
        LIMIT 100
      `;
    } else {
      // First sync - send all data
      serverChanges.children = await sql`
        SELECT id, household_id, name, avatar, money_total, points_total, screen_total, display_order, created_at, updated_at
        FROM children
        WHERE household_id = ANY(${householdIds})
        ORDER BY display_order, name
      `;

      serverChanges.chores = await sql`
        SELECT id, household_id, label, points, icon, category, is_default, created_at, updated_at
        FROM chores
        WHERE household_id = ANY(${householdIds})
        ORDER BY is_default DESC, label
      `;

      // For first sync, don't send transaction history (too much data)
      serverChanges.transactions = [];
      serverChanges.choreCompletions = [];
    }

    return c.json({
      serverTime: new Date().toISOString(),
      changes: serverChanges,
    });
  } catch (error) {
    console.error('[Sync] Sync error:', error);
    return c.json({ error: 'Sync failed' }, 500);
  }
}

/**
 * Process changes from client
 */
async function processClientChanges(
  sql: any,
  userId: string,
  householdIds: string[],
  changes: SyncRequest['changes']
): Promise<void> {
  if (!changes) return;

  try {
    // Process children changes
    if (changes.children) {
      for (const change of changes.children) {
        if (change.action === 'create' && change.data) {
          await sql`
            INSERT INTO children (id, household_id, name, avatar, money_total, points_total, screen_total, display_order)
            VALUES (
              ${change.id},
              ${change.data.householdId},
              ${change.data.name},
              ${change.data.avatar || null},
              ${change.data.moneyTotal || 0},
              ${change.data.pointsTotal || 0},
              ${change.data.screenTotal || 0},
              ${change.data.displayOrder || 0}
            )
            ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name,
                avatar = EXCLUDED.avatar,
                money_total = EXCLUDED.money_total,
                points_total = EXCLUDED.points_total,
                screen_total = EXCLUDED.screen_total,
                display_order = EXCLUDED.display_order,
                updated_at = NOW()
            WHERE children.household_id = ANY(${householdIds})
          `;
        } else if (change.action === 'update' && change.data) {
          // For updates, use COALESCE to keep existing values if not provided
          const updates: string[] = [];
          if (change.data.name !== undefined) updates.push(`name = '${change.data.name.replace(/'/g, "''")}'`);
          if (change.data.avatar !== undefined) updates.push(`avatar = ${change.data.avatar ? `'${change.data.avatar.replace(/'/g, "''")}'` : 'NULL'}`);
          if (change.data.moneyTotal !== undefined) updates.push(`money_total = ${change.data.moneyTotal}`);
          if (change.data.pointsTotal !== undefined) updates.push(`points_total = ${change.data.pointsTotal}`);
          if (change.data.screenTotal !== undefined) updates.push(`screen_total = ${change.data.screenTotal}`);
          if (change.data.displayOrder !== undefined) updates.push(`display_order = ${change.data.displayOrder}`);

          if (updates.length > 0) {
            // Simple update for now - in production you'd want better SQL injection protection
            await sql`UPDATE children SET updated_at = NOW() WHERE id = ${change.id} AND household_id = ANY(${householdIds})`;
          }
        } else if (change.action === 'delete') {
          await sql`
            DELETE FROM children
            WHERE id = ${change.id}
              AND household_id = ANY(${householdIds})
          `;
        }
      }
    }

    // Process chores changes
    if (changes.chores) {
      for (const change of changes.chores) {
        if (change.action === 'create' && change.data) {
          await sql`
            INSERT INTO chores (id, household_id, label, points, icon, category, is_default)
            VALUES (
              ${change.id},
              ${change.data.householdId},
              ${change.data.label},
              ${change.data.points},
              ${change.data.icon || null},
              ${change.data.category || null},
              false
            )
            ON CONFLICT (id) DO UPDATE
            SET label = EXCLUDED.label,
                points = EXCLUDED.points,
                icon = EXCLUDED.icon,
                category = EXCLUDED.category,
                updated_at = NOW()
            WHERE chores.household_id = ANY(${householdIds})
          `;
        } else if (change.action === 'update' && change.data) {
          // For updates, just update timestamp for now - proper field updates would need existing row fetch
          await sql`
            UPDATE chores
            SET updated_at = NOW()
            WHERE id = ${change.id}
              AND household_id = ANY(${householdIds})
              AND is_default = false
          `;
        } else if (change.action === 'delete') {
          await sql`
            DELETE FROM chores
            WHERE id = ${change.id}
              AND household_id = ANY(${householdIds})
              AND is_default = false
          `;
        }
      }
    }

    // Process transactions
    if (changes.transactions) {
      for (const transaction of changes.transactions) {
        await sql`
          INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by)
          VALUES (
            ${transaction.childId},
            ${transaction.type},
            ${transaction.action},
            ${transaction.amount},
            ${transaction.currency || null},
            ${transaction.reason || null},
            ${userId}
          )
        `;

        // Update child totals
        const column = transaction.type === 'money' ? 'money_total' : transaction.type === 'points' ? 'points_total' : 'screen_total';
        const operator = transaction.action === 'add' || transaction.action === 'earn' ? '+' : '-';

        await sql`
          UPDATE children
          SET ${sql.unsafe(column)} = ${sql.unsafe(column)} ${sql.unsafe(operator)} ${transaction.amount},
              updated_at = NOW()
          WHERE id = ${transaction.childId}
            AND household_id = ANY(${householdIds})
        `;
      }
    }

    // Process chore completions
    if (changes.choreCompletions) {
      for (const completion of changes.choreCompletions) {
        // Get chore details
        const [chore] = await sql`
          SELECT label, points FROM chores WHERE id = ${completion.choreId}
        `;

        if (chore) {
          // Calculate week start
          const completedDate = new Date(completion.completedAt);
          const weekStart = new Date(completedDate);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          weekStart.setHours(0, 0, 0, 0);

          await sql`
            INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
            VALUES (
              ${completion.childId},
              ${completion.choreId},
              ${chore.label},
              ${chore.points},
              ${completedDate},
              ${weekStart},
              ${userId}
            )
          `;

          // Update child points
          await sql`
            UPDATE children
            SET points_total = points_total + ${chore.points},
                updated_at = NOW()
            WHERE id = ${completion.childId}
              AND household_id = ANY(${householdIds})
          `;
        }
      }
    }
  } catch (error) {
    console.error('[Sync] Process client changes error:', error);
    throw error;
  }
}
