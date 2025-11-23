-- Migration: Rename owner_id to created_by in households table
-- This aligns the database schema with the application code

BEGIN;

-- Drop the old index
DROP INDEX IF EXISTS idx_households_owner;

-- Rename the column
ALTER TABLE households RENAME COLUMN owner_id TO created_by;

-- Create the new index
CREATE INDEX IF NOT EXISTS idx_households_created_by ON households(created_by);

-- Recreate the household_summary view with the new column name
DROP VIEW IF EXISTS household_summary;
CREATE OR REPLACE VIEW household_summary AS
SELECT
  h.id AS household_id,
  h.name AS household_name,
  h.created_by,
  COUNT(DISTINCT c.id) AS children_count,
  COUNT(DISTINCT ch.id) AS chores_count,
  h.created_at,
  h.updated_at
FROM households h
LEFT JOIN children c ON c.household_id = h.id
LEFT JOIN chores ch ON ch.household_id = h.id
GROUP BY h.id, h.name, h.created_by, h.created_at, h.updated_at;

COMMIT;
