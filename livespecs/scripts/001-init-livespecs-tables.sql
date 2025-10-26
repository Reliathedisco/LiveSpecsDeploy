-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  image_url TEXT,
  plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'TEAM', 'ENTERPRISE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create specs table
CREATE TABLE IF NOT EXISTS specs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spec_versions table
CREATE TABLE IF NOT EXISTS spec_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaborators table
CREATE TABLE IF NOT EXISTS collaborators (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'EDITOR' CHECK (role IN ('VIEWER', 'EDITOR', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spec_id, user_id)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'ADMIN', 'OWNER')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_specs_owner_id ON specs(owner_id);
CREATE INDEX IF NOT EXISTS idx_spec_versions_spec_id ON spec_versions(spec_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_spec_id ON collaborators(spec_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
