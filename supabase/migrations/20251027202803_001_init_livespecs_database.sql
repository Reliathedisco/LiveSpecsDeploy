/*
  # LiveSpecs Database Initialization
  
  ## Overview
  This migration initializes the complete LiveSpecs database schema for a collaborative
  API design platform with real-time editing, version control, and enterprise features.
  
  ## 1. Core Tables
  
  ### users
  - Stores user account information
  - Fields: id, auth0_id (formerly clerk_id), email, name, image_url, plan
  - Plans: FREE, TEAM, ENTERPRISE
  
  ### teams
  - Team/organization management
  - Fields: id, name, owner_id, plan
  
  ### team_members
  - Team membership records
  - Roles: MEMBER, ADMIN, OWNER
  
  ### specs
  - Stores API specification documents (OpenAPI/Swagger)
  - Fields: id, name, content, owner_id, team_id
  - References users and teams
  
  ### spec_versions
  - Version history for specs
  - Fields: id, spec_id, content, message, created_at
  - Enables rollback and change tracking
  
  ### collaborators
  - Defines who can access each spec
  - Roles: VIEWER (read-only), EDITOR (read/write), ADMIN (full control)
  
  ## 2. Feature Tables
  
  ### comments
  - Inline spec annotations and discussions
  - Supports threaded replies via parent_id
  - Can be resolved when addressed
  
  ### webhooks & webhook_deliveries
  - Webhook configuration and delivery tracking
  - Supports multiple event types per webhook
  
  ### notifications
  - User notifications for spec changes, comments, etc.
  
  ### github_connections & github_syncs
  - GitHub integration for spec sync
  - Stores OAuth tokens and sync configuration
  
  ## 3. Enterprise Features
  
  ### audit_logs
  - Complete audit trail of all actions
  - Tracks user, action, resource, IP, and user agent
  
  ### permissions
  - Granular access control beyond collaborator roles
  - Permissions: read, write, admin, delete
  
  ### sso_connections
  - Enterprise SSO (SAML/OIDC) configuration
  
  ### api_keys
  - Programmatic API access
  - Secure key hashing and expiration
  
  ### custom_domains
  - Custom domain hosting for teams
  - Domain verification and SSL support
  
  ### branding_settings
  - White-label customization
  - Custom logos, colors, CSS
  
  ## 4. Security
  
  All tables have RLS enabled with restrictive policies requiring authentication.
  Policies enforce ownership checks and team membership verification.
  
  ## 5. Performance
  
  Strategic indexes on:
  - Foreign keys
  - Lookup fields (email, auth0_id, domain)
  - Date fields for sorting
  - Frequently queried fields
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES (in dependency order)
-- ============================================================================

-- Users table (no dependencies)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  auth0_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image_url TEXT,
  plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'TEAM', 'ENTERPRISE')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teams table (depends on users)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'TEAM', 'ENTERPRISE')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team members table (depends on teams and users)
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'ADMIN', 'OWNER')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Specs table (depends on users and teams)
CREATE TABLE IF NOT EXISTS specs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Spec versions table (depends on specs)
CREATE TABLE IF NOT EXISTS spec_versions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Collaborators table (depends on specs and users)
CREATE TABLE IF NOT EXISTS collaborators (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'EDITOR' CHECK (role IN ('VIEWER', 'EDITOR', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(spec_id, user_id)
);

-- ============================================================================
-- FEATURE TABLES
-- ============================================================================

-- Comments table (depends on specs and users, self-referential)
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  line_number INTEGER,
  resolved BOOLEAN DEFAULT false,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhooks table (depends on specs)
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook deliveries table (depends on webhooks)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications table (depends on users and specs)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spec_id TEXT REFERENCES specs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GitHub connections table (depends on users)
CREATE TABLE IF NOT EXISTS github_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  github_user_id TEXT NOT NULL,
  github_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- GitHub syncs table (depends on specs)
CREATE TABLE IF NOT EXISTS github_syncs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE UNIQUE,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  branch TEXT DEFAULT 'main',
  auto_sync BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ENTERPRISE TABLES
-- ============================================================================

-- Audit logs table (depends on users and specs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spec_id TEXT REFERENCES specs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions table (depends on specs, users, and teams)
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'admin', 'delete')),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_or_team_check CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL)
  )
);

-- SSO connections table (depends on teams)
CREATE TABLE IF NOT EXISTS sso_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('saml', 'oidc')),
  domain TEXT NOT NULL,
  metadata_url TEXT,
  entity_id TEXT,
  sso_url TEXT,
  certificate TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, domain)
);

-- API keys table (depends on users)
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Custom domains table (depends on teams)
CREATE TABLE IF NOT EXISTS custom_domains (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT NOT NULL,
  ssl_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Branding settings table (depends on teams)
CREATE TABLE IF NOT EXISTS branding_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT DEFAULT '#ffffff',
  custom_css TEXT,
  company_name TEXT,
  support_email TEXT,
  hide_livespecs_branding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Specs indexes
CREATE INDEX IF NOT EXISTS idx_specs_owner_id ON specs(owner_id);
CREATE INDEX IF NOT EXISTS idx_specs_team_id ON specs(team_id);
CREATE INDEX IF NOT EXISTS idx_specs_updated_at ON specs(updated_at DESC);

-- Spec versions indexes
CREATE INDEX IF NOT EXISTS idx_spec_versions_spec_id ON spec_versions(spec_id);
CREATE INDEX IF NOT EXISTS idx_spec_versions_created_at ON spec_versions(created_at DESC);

-- Collaborators indexes
CREATE INDEX IF NOT EXISTS idx_collaborators_spec_id ON collaborators(spec_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_spec_id ON comments(spec_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Webhooks indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_spec_id ON webhooks(spec_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- GitHub indexes
CREATE INDEX IF NOT EXISTS idx_github_connections_user_id ON github_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_github_syncs_spec_id ON github_syncs(spec_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_spec_id ON audit_logs(spec_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Permissions indexes
CREATE INDEX IF NOT EXISTS idx_permissions_spec_id ON permissions(spec_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_team_id ON permissions(team_id);

-- SSO connections indexes
CREATE INDEX IF NOT EXISTS idx_sso_connections_team_id ON sso_connections(team_id);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- Custom domains indexes
CREATE INDEX IF NOT EXISTS idx_custom_domains_team_id ON custom_domains(team_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);

-- Branding settings indexes
CREATE INDEX IF NOT EXISTS idx_branding_settings_team_id ON branding_settings(team_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth0_id = auth.jwt()->>'sub');

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth0_id = auth.jwt()->>'sub')
  WITH CHECK (auth0_id = auth.jwt()->>'sub');

-- Teams policies
CREATE POLICY "Team members can view their teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    OR id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

CREATE POLICY "Team owners can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'))
  WITH CHECK (owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

CREATE POLICY "Team owners can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

-- Team members policies
CREATE POLICY "Users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    OR team_id IN (
      SELECT id FROM teams WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
    OR team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

-- Specs policies
CREATE POLICY "Users can view own specs"
  ON specs FOR SELECT
  TO authenticated
  USING (
    owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    OR id IN (
      SELECT spec_id FROM collaborators 
      WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create specs"
  ON specs FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

CREATE POLICY "Users can update own specs"
  ON specs FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    OR id IN (
      SELECT spec_id FROM collaborators 
      WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
      AND role IN ('EDITOR', 'ADMIN')
    )
  )
  WITH CHECK (
    owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    OR id IN (
      SELECT spec_id FROM collaborators 
      WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
      AND role IN ('EDITOR', 'ADMIN')
    )
  );

CREATE POLICY "Users can delete own specs"
  ON specs FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

-- Spec versions policies
CREATE POLICY "Users can view spec versions"
  ON spec_versions FOR SELECT
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
    OR spec_id IN (
      SELECT spec_id FROM collaborators 
      WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create spec versions"
  ON spec_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
    OR spec_id IN (
      SELECT spec_id FROM collaborators 
      WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
      AND role IN ('EDITOR', 'ADMIN')
    )
  );

-- Collaborators policies
CREATE POLICY "Users can view collaborators"
  ON collaborators FOR SELECT
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
    OR user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
  );

CREATE POLICY "Spec owners can manage collaborators"
  ON collaborators FOR ALL
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

-- Comments policies
CREATE POLICY "Users can view comments on accessible specs"
  ON comments FOR SELECT
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
    OR spec_id IN (
      SELECT spec_id FROM collaborators 
      WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can create comments on accessible specs"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    AND (
      spec_id IN (
        SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
      )
      OR spec_id IN (
        SELECT spec_id FROM collaborators 
        WHERE user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
      )
    )
  );

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

-- Webhooks policies
CREATE POLICY "Spec owners can manage webhooks"
  ON webhooks FOR ALL
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

-- Webhook deliveries policies
CREATE POLICY "Spec owners can view webhook deliveries"
  ON webhook_deliveries FOR SELECT
  TO authenticated
  USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE spec_id IN (
        SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
      )
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

-- GitHub connections policies
CREATE POLICY "Users can manage own GitHub connection"
  ON github_connections FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

-- GitHub syncs policies
CREATE POLICY "Users can view GitHub syncs for accessible specs"
  ON github_syncs FOR SELECT
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Spec owners can manage GitHub syncs"
  ON github_syncs FOR ALL
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

-- Audit logs policies
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

-- Permissions policies
CREATE POLICY "Users can view permissions for accessible specs"
  ON permissions FOR SELECT
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Spec owners can manage permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (
    spec_id IN (
      SELECT id FROM specs WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

-- SSO connections policies
CREATE POLICY "Team owners can manage SSO connections"
  ON sso_connections FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

-- API keys policies
CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub'));

-- Custom domains policies
CREATE POLICY "Team owners can manage custom domains"
  ON custom_domains FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );

-- Branding settings policies
CREATE POLICY "Team owners can manage branding settings"
  ON branding_settings FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT id FROM teams WHERE owner_id = (SELECT id FROM users WHERE auth0_id = auth.jwt()->>'sub')
    )
  );