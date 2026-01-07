-- Migration: Add user career context and role intent fields

-- 1. User career context table
CREATE TABLE IF NOT EXISTS user_career_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  career_deep_dive TEXT,
  guidelines_tips TEXT,
  guidelines_file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add fit analysis cache to role_intents
ALTER TABLE role_intents ADD COLUMN IF NOT EXISTS fit_analysis JSONB;
ALTER TABLE role_intents ADD COLUMN IF NOT EXISTS user_corrections TEXT;

-- 3. Add is_cv flag to artifacts
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS is_cv BOOLEAN DEFAULT FALSE;

-- RLS policies for user_career_context
ALTER TABLE user_career_context ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own context" ON user_career_context;
CREATE POLICY "Users can view own context" ON user_career_context
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own context" ON user_career_context;
CREATE POLICY "Users can insert own context" ON user_career_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own context" ON user_career_context;
CREATE POLICY "Users can update own context" ON user_career_context
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own context" ON user_career_context;
CREATE POLICY "Users can delete own context" ON user_career_context
  FOR DELETE USING (auth.uid() = user_id);
