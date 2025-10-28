-- Migration: make password_hash nullable for Google OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
