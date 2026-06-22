-- Migration: Add is_admin column to profiles table
-- Run this against your Supabase project via the SQL Editor or CLI

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
  ON public.profiles(is_admin)
  WHERE is_admin = TRUE;