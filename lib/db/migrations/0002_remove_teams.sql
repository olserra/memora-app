-- Migration: remove teams and related tables, and drop team_id from memories
-- This migration will:
-- 1. Drop foreign key constraints referencing teams
-- 2. Drop tables: team_members, invitations, activity_logs, teams
-- 3. Remove team_id column from memories

-- Step 1: drop constraints if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.constraint_name = 'memories_team_id_teams_id_fk'
  ) THEN
    ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_team_id_teams_id_fk;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.constraint_name = 'activity_logs_team_id_fkey'
  ) THEN
    ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_team_id_fkey;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Step 2: drop tables if they exist
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Step 3: remove team_id column from memories (if exists)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='memories' AND column_name='team_id'
  ) THEN
    ALTER TABLE memories DROP COLUMN IF EXISTS team_id;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Migration finished
