/**
 * Chores handlers
 */

import type { Context } from 'hono';
import type { Env } from '../types/env';
import { createDbConnection } from '../utils/db';

/**
 * GET /v1/chores
 * Get all chores for a household
 */
export async function getChores(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const householdId = c.req.query('householdId');

    if (!householdId) {
      return c.json({ error: 'Household ID is required' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify household access
    const [household] = await sql`
      SELECT id FROM households
      WHERE id = ${householdId}
        AND (owner_id = ${user.userId}
             OR id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId}
             ))
    `;

    if (!household) {
      return c.json({ error: 'Household not found or unauthorized' }, 404);
    }

    // Get chores
    const chores = await sql`
      SELECT id, household_id, label, points, icon, category, is_default, created_at, updated_at
      FROM chores
      WHERE household_id = ${householdId}
      ORDER BY is_default DESC, label
    `;

    return c.json({ chores });
  } catch (error) {
    console.error('[Chores] Get chores error:', error);
    return c.json({ error: 'Failed to fetch chores' }, 500);
  }
}

/**
 * POST /v1/chores
 * Create a new chore
 */
export async function createChore(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { householdId, label, points, icon, category } = body;

    if (!householdId || !label || points === undefined) {
      return c.json({ error: 'Household ID, label, and points are required' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify household access
    const [household] = await sql`
      SELECT id FROM households
      WHERE id = ${householdId}
        AND (owner_id = ${user.userId}
             OR id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId} AND role IN ('owner', 'parent')
             ))
    `;

    if (!household) {
      return c.json({ error: 'Household not found or unauthorized' }, 403);
    }

    // Create chore
    const [chore] = await sql`
      INSERT INTO chores (household_id, label, points, icon, category, is_default)
      VALUES (${householdId}, ${label.trim()}, ${points}, ${icon || null}, ${category || null}, false)
      RETURNING id, household_id, label, points, icon, category, is_default, created_at, updated_at
    `;

    return c.json({ chore }, 201);
  } catch (error) {
    console.error('[Chores] Create chore error:', error);
    return c.json({ error: 'Failed to create chore' }, 500);
  }
}

/**
 * PUT /v1/chores/:id
 * Update a chore
 */
export async function updateChore(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const choreId = c.req.param('id');
    const body = await c.req.json();
    const { label, points, icon, category } = body;

    const sql = createDbConnection(c.env.DATABASE_URL);

    // First, fetch existing chore to verify access and get current values
    const [existing] = await sql`
      SELECT ch.id, ch.household_id, ch.label, ch.points, ch.icon, ch.category, ch.is_default
      FROM chores ch
      JOIN households h ON h.id = ch.household_id
      WHERE ch.id = ${choreId}
        AND (h.owner_id = ${user.userId}
             OR h.id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId} AND role IN ('owner', 'parent')
             ))
    `;

    if (!existing) {
      return c.json({ error: 'Chore not found or unauthorized' }, 404);
    }

    // Update chore with new values
    const [chore] = await sql`
      UPDATE chores
      SET label = ${label !== undefined ? label.trim() : existing.label},
          points = ${points !== undefined ? points : existing.points},
          icon = ${icon !== undefined ? icon : existing.icon},
          category = ${category !== undefined ? category : existing.category},
          updated_at = NOW()
      WHERE id = ${choreId}
      RETURNING id, household_id, label, points, icon, category, is_default, created_at, updated_at
    `;

    return c.json({ chore });
  } catch (error) {
    console.error('[Chores] Update chore error:', error);
    return c.json({ error: 'Failed to update chore' }, 500);
  }
}

/**
 * DELETE /v1/chores/:id
 * Delete a chore
 */
export async function deleteChore(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const choreId = c.req.param('id');
    const sql = createDbConnection(c.env.DATABASE_URL);

    // Delete chore with access check
    const result = await sql`
      DELETE FROM chores ch
      USING households h
      WHERE ch.id = ${choreId}
        AND ch.household_id = h.id
        AND ch.is_default = false
        AND (h.owner_id = ${user.userId}
             OR h.id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId} AND role IN ('owner', 'parent')
             ))
      RETURNING ch.id
    ` as any[];

    if (result.length === 0) {
      return c.json({ error: 'Chore not found, is default, or unauthorized' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[Chores] Delete chore error:', error);
    return c.json({ error: 'Failed to delete chore' }, 500);
  }
}

/**
 * POST /v1/chores/complete
 * Mark chore as completed
 */
export async function completeChore(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { childId, choreId, completedAt } = body;

    if (!childId || !choreId) {
      return c.json({ error: 'Child ID and chore ID are required' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify access to child and get chore details
    const [data] = await sql`
      SELECT c.id as child_id, c.household_id, ch.id as chore_id, ch.label, ch.points
      FROM children c
      JOIN households h ON h.id = c.household_id
      JOIN chores ch ON ch.household_id = h.id
      WHERE c.id = ${childId}
        AND ch.id = ${choreId}
        AND (h.owner_id = ${user.userId}
             OR h.id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId} AND role IN ('owner', 'parent')
             ))
    `;

    if (!data) {
      return c.json({ error: 'Child or chore not found, or unauthorized' }, 403);
    }

    // Calculate week start (Monday)
    const completedDate = completedAt ? new Date(completedAt) : new Date();
    const weekStart = new Date(completedDate);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    // Create completion record
    const [completion] = await sql`
      INSERT INTO chore_completions (child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by)
      VALUES (${childId}, ${choreId}, ${data.label}, ${data.points}, ${completedDate}, ${weekStart}, ${user.userId})
      RETURNING id, child_id, chore_id, chore_label, points_earned, completed_at, week_start, created_by
    `;

    // Update child points total
    await sql`
      UPDATE children
      SET points_total = points_total + ${data.points}, updated_at = NOW()
      WHERE id = ${childId}
    `;

    return c.json({ completion }, 201);
  } catch (error) {
    console.error('[Chores] Complete chore error:', error);
    return c.json({ error: 'Failed to complete chore' }, 500);
  }
}

/**
 * GET /v1/chores/completions
 * Get chore completion history
 */
export async function getChoreCompletions(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const childId = c.req.query('childId');
    const householdId = c.req.query('householdId');
    const weekStart = c.req.query('weekStart');

    if (!childId && !householdId) {
      return c.json({ error: 'Child ID or household ID is required' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    let completions;
    if (childId) {
      // Get completions for specific child
      completions = await sql`
        SELECT cc.*
        FROM chore_completions cc
        JOIN children c ON c.id = cc.child_id
        JOIN households h ON h.id = c.household_id
        WHERE cc.child_id = ${childId}
          ${weekStart ? sql`AND cc.week_start = ${weekStart}` : sql``}
          AND (h.owner_id = ${user.userId}
               OR h.id IN (
                 SELECT household_id FROM household_members WHERE user_id = ${user.userId}
               ))
        ORDER BY cc.completed_at DESC
        LIMIT 100
      `;
    } else {
      // Get completions for household
      completions = await sql`
        SELECT cc.*, c.name as child_name
        FROM chore_completions cc
        JOIN children c ON c.id = cc.child_id
        WHERE c.household_id = ${householdId}
          ${weekStart ? sql`AND cc.week_start = ${weekStart}` : sql``}
          AND (c.household_id IN (
            SELECT id FROM households WHERE owner_id = ${user.userId}
            UNION
            SELECT household_id FROM household_members WHERE user_id = ${user.userId}
          ))
        ORDER BY cc.completed_at DESC
        LIMIT 100
      `;
    }

    return c.json({ completions });
  } catch (error) {
    console.error('[Chores] Get completions error:', error);
    return c.json({ error: 'Failed to fetch completions' }, 500);
  }
}
