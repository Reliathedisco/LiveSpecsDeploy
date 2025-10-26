-- Create github_connections table
CREATE TABLE IF NOT EXISTS github_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_user_id TEXT NOT NULL,
  github_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create github_syncs table
CREATE TABLE IF NOT EXISTS github_syncs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  branch TEXT DEFAULT 'main',
  auto_sync BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spec_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_github_connections_user_id ON github_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_github_syncs_spec_id ON github_syncs(spec_id);
