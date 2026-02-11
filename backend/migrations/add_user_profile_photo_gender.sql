-- Migration: Add profile_photo and gender columns to users table
-- Run this if the columns don't exist yet

DO $$ 
BEGIN
  -- Add profile_photo column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_photo'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_photo TEXT;
    RAISE NOTICE 'Added profile_photo column to users table';
  ELSE
    RAISE NOTICE 'profile_photo column already exists';
  END IF;

  -- Add gender column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'gender'
  ) THEN
    ALTER TABLE users ADD COLUMN gender VARCHAR(20);
    RAISE NOTICE 'Added gender column to users table';
  ELSE
    RAISE NOTICE 'gender column already exists';
  END IF;
END $$;
