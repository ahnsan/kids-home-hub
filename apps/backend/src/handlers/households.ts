/**
 * Household handlers
 */

import type { Context } from 'hono';
import type { Env } from '../types/env';
import { createDbConnection } from '../utils/db';

/**
 * GET /v1/households
 * Get user's households
 */
export async function getHouseholds(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const sql = createDbConnection(c.env.DATABASE_URL);

    const households = await sql`
      SELECT h.id, h.name, h.created_by, h.created_at, h.updated_at,
             u.email as owner_email
      FROM households h
      JOIN users u ON u.id = h.created_by
      WHERE h.created_by = ${user.userId}
         OR h.id IN (
           SELECT household_id FROM household_members WHERE user_id = ${user.userId}
         )
      ORDER BY h.created_at DESC
    `;

    return c.json({ households });
  } catch (error) {
    console.error('[Households] Get households error:', error);
    return c.json({ error: 'Failed to fetch households' }, 500);
  }
}

/**
 * POST /v1/households
 * Create a new household
 */
export async function createHousehold(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return c.json({ error: 'Household name is required' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Create household
    const result = await sql`
      INSERT INTO households (name, created_by)
      VALUES (${name.trim()}, ${user.userId})
      RETURNING id, name, created_by, created_at, updated_at
    ` as any[];
    const household = result[0];

    // Add owner as household member
    await sql`
      INSERT INTO household_members (household_id, user_id, role)
      VALUES (${household.id}, ${user.userId}, 'owner')
    `;

    // Create default chores for the household
    await sql`
      SELECT create_default_chores(${household.id})
    `;

    return c.json({ household }, 201);
  } catch (error) {
    console.error('[Households] Create household error:', error);
    return c.json({ error: 'Failed to create household' }, 500);
  }
}

/**
 * GET /v1/households/:id
 * Get household details
 */
export async function getHousehold(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const householdId = c.req.param('id');
    const sql = createDbConnection(c.env.DATABASE_URL);

    // Verify access
    const householdResult = await sql`
      SELECT h.id, h.name, h.created_by, h.created_at, h.updated_at,
             u.email as owner_email
      FROM households h
      JOIN users u ON u.id = h.created_by
      WHERE h.id = ${householdId}
        AND (h.created_by = ${user.userId}
             OR h.id IN (
               SELECT household_id FROM household_members WHERE user_id = ${user.userId}
             ))
    ` as any[];
    const household = householdResult[0];

    if (!household) {
      return c.json({ error: 'Household not found' }, 404);
    }

    // Get members
    const members = await sql`
      SELECT hm.id, hm.role, hm.joined_at,
             u.id as user_id, u.email
      FROM household_members hm
      JOIN users u ON u.id = hm.user_id
      WHERE hm.household_id = ${householdId}
      ORDER BY hm.joined_at
    `;

    return c.json({
      household: {
        ...household,
        members,
      },
    });
  } catch (error) {
    console.error('[Households] Get household error:', error);
    return c.json({ error: 'Failed to fetch household' }, 500);
  }
}

/**
 * PATCH /v1/households/:id
 * Update household
 */
export async function updateHousehold(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const householdId = c.req.param('id');
    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return c.json({ error: 'Household name is required' }, 400);
    }

    const sql = createDbConnection(c.env.DATABASE_URL);

    // Update household (only owner can update)
    const updateResult = await sql`
      UPDATE households
      SET name = ${name.trim()}, updated_at = NOW()
      WHERE id = ${householdId}
        AND created_by = ${user.userId}
      RETURNING id, name, created_by, created_at, updated_at
    ` as any[];
    const household = updateResult[0];

    if (!household) {
      return c.json({ error: 'Household not found or unauthorized' }, 404);
    }

    return c.json({ household });
  } catch (error) {
    console.error('[Households] Update household error:', error);
    return c.json({ error: 'Failed to update household' }, 500);
  }
}

/**
 * DELETE /v1/households/:id
 * Delete household
 */
export async function deleteHousehold(c: Context<{ Bindings: Env }>) {
  try {
    const user = c.get('user');
    const householdId = c.req.param('id');
    const sql = createDbConnection(c.env.DATABASE_URL);

    // Delete household (only owner can delete)
    const result = await sql`
      DELETE FROM households
      WHERE id = ${householdId}
        AND created_by = ${user.userId}
      RETURNING id
    ` as any[];

    if (result.length === 0) {
      return c.json({ error: 'Household not found or unauthorized' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('[Households] Delete household error:', error);
    return c.json({ error: 'Failed to delete household' }, 500);
  }
}
