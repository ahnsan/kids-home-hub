/**
 * Children handlers
 */

import type { Context } from 'hono';
import type { Env } from '../types/env';
import { createDbConnection } from '../utils/db';

/**
 * GET /v1/households/:householdId/children
 * Get all children in a household
 */
export async function getChildren(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const householdId = c.req.param('householdId');
    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify household access
    const householdResult = await sql`
      SELECT id FROM households
      WHERE id = ${householdId}
        AND (created_by = ${user.userId}
             OR id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId}
             ))
    ` as any[];

    const household = householdResult[0];

    if (!household) {
      return c.json({ error: 'Household not found or unauthorized' }, 404);
    }

    // Get children
    const children = await sql`
      SELECT id, household_id, name, avatar, money_total, points_total, screen_total, display_order, created_at, updated_at
      FROM children
      WHERE household_id = ${householdId}
      ORDER BY display_order, name
    `;

    return c.json({ children });
  } catch (error) {
    console.error('[Children] Get children error:', error);
    return c.json({ error: 'Failed to fetch children' }, 500);
  }
}

/**
 * POST /v1/children
 * Create a new child
 */
export async function createChild(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { householdId, name, avatar, displayOrder } = body;

    if (!householdId || !name) {
      return c.json({ error: 'Household ID and name are required' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify household access
    const householdResult2 = await sql`
      SELECT id FROM households
      WHERE id = ${householdId}
        AND (created_by = ${user.userId}
             OR id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId} AND role IN ('owner', 'parent')
             ))
    ` as any[];

    const household = householdResult2[0];

    if (!household) {
      return c.json({ error: 'Household not found or unauthorized' }, 403);
    }

    // Create child
    const childResult = await sql`
      INSERT INTO children (household_id, name, avatar, display_order)
      VALUES (${householdId}, ${name.trim()}, ${avatar || null}, ${displayOrder || 0})
      RETURNING id, household_id, name, avatar, money_total, points_total, screen_total, display_order, created_at, updated_at
    ` as any[];

    const child = childResult[0];

    return c.json({ child }, 201);
  } catch (error) {
    console.error('[Children] Create child error:', error);
    return c.json({ error: 'Failed to create child' }, 500);
  }
}

/**
 * PATCH /v1/children/:id
 * Update child data
 */
export async function updateChild(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const childId = c.req.param('id');
    const body = await c.req.json();
    const { name, avatar, moneyTotal, pointsTotal, screenTotal, displayOrder } = body;

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify access to child
    const childResult2 = await sql`
      SELECT c.id, c.household_id
      FROM children c
      JOIN households h ON h.id = c.household_id
      WHERE c.id = ${childId}
        AND (h.created_by = ${user.userId}
             OR h.id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId} AND role IN ('owner', 'parent')
             ))
    ` as any[];

    const child = childResult2[0];

    if (!child) {
      return c.json({ error: 'Child not found or unauthorized' }, 404);
    }

    // Prepare values with defaults from existing child
    const updatedValues = {
      name: name !== undefined ? name.trim() : child.name,
      avatar: avatar !== undefined ? avatar : child.avatar,
      moneyTotal: moneyTotal !== undefined ? moneyTotal : child.money_total,
      pointsTotal: pointsTotal !== undefined ? pointsTotal : child.points_total,
      screenTotal: screenTotal !== undefined ? screenTotal : child.screen_total,
      displayOrder: displayOrder !== undefined ? displayOrder : child.display_order,
    };

    // Update child
    const updatedChildResult = await sql`
      UPDATE children
      SET name = ${updatedValues.name},
          avatar = ${updatedValues.avatar},
          money_total = ${updatedValues.moneyTotal},
          points_total = ${updatedValues.pointsTotal},
          screen_total = ${updatedValues.screenTotal},
          display_order = ${updatedValues.displayOrder},
          updated_at = NOW()
      WHERE id = ${childId}
      RETURNING id, household_id, name, avatar, money_total, points_total, screen_total, display_order, created_at, updated_at
    ` as any[];

    const updatedChild = updatedChildResult[0];

    return c.json({ child: updatedChild });
  } catch (error) {
    console.error('[Children] Update child error:', error);
    return c.json({ error: 'Failed to update child' }, 500);
  }
}

/**
 * DELETE /v1/children/:id
 * Delete a child
 */
export async function deleteChild(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const childId = c.req.param('id');
    const sql = createDbConnection(c.env.DATABASE_URL);

    // Delete child (with access check)
    const result = await sql`
      DELETE FROM children c
      USING households h
      WHERE c.id = ${childId}
        AND c.household_id = h.id
        AND (h.created_by = ${user.userId}
             OR h.id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId} AND role IN ('owner', 'parent')
             ))
      RETURNING c.id
    ` as any[];

    if (result.length === 0) {
      return c.json({ error: 'Child not found or unauthorized' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[Children] Delete child error:', error);
    return c.json({ error: 'Failed to delete child' }, 500);
  }
}

/**
 * POST /v1/transactions
 * Create a transaction (money, points, screen time)
 */
export async function createTransaction(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { childId, type, action, amount, currency, reason } = body;

    if (!childId || !type || !action || amount === undefined) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify access to child
    const childResult3 = await sql`
      SELECT c.id, c.household_id
      FROM children c
      JOIN households h ON h.id = c.household_id
      WHERE c.id = ${childId}
        AND (h.created_by = ${user.userId}
             OR h.id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId} AND role IN ('owner', 'parent')
             ))
    ` as any[];

    const child = childResult3[0];

    if (!child) {
      return c.json({ error: 'Child not found or unauthorized' }, 403);
    }

    // Create transaction
    const transactionResult = await sql`
      INSERT INTO transactions (child_id, type, action, amount, currency, reason, created_by)
      VALUES (${childId}, ${type}, ${action}, ${amount}, ${currency || null}, ${reason || null}, ${user.userId})
      RETURNING id, child_id, type, action, amount, currency, reason, created_by, created_at
    ` as any[];

    const transaction = transactionResult[0];

    // Update child totals based on transaction type
    if (type === 'money') {
      if (action === 'add' || action === 'earn') {
        await sql`UPDATE children SET money_total = money_total + ${amount} WHERE id = ${childId}`;
      } else {
        await sql`UPDATE children SET money_total = money_total - ${amount} WHERE id = ${childId}`;
      }
    } else if (type === 'points') {
      if (action === 'add' || action === 'earn') {
        await sql`UPDATE children SET points_total = points_total + ${amount} WHERE id = ${childId}`;
      } else {
        await sql`UPDATE children SET points_total = points_total - ${amount} WHERE id = ${childId}`;
      }
    } else {
      if (action === 'add' || action === 'earn') {
        await sql`UPDATE children SET screen_total = screen_total + ${amount} WHERE id = ${childId}`;
      } else {
        await sql`UPDATE children SET screen_total = screen_total - ${amount} WHERE id = ${childId}`;
      }
    }

    return c.json({ transaction }, 201);
  } catch (error) {
    console.error('[Children] Create transaction error:', error);
    return c.json({ error: 'Failed to create transaction' }, 500);
  }
}
