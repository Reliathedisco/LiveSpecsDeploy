-- Migration to rename clerk_id column to auth0_id
-- Note: This is a column rename only, as we're using @map("clerk_id") in Prisma to maintain backward compatibility

-- This migration is optional if you're using Prisma's @map directive
-- The @map("clerk_id") directive in the Prisma schema means the database column
-- remains "clerk_id" while the Prisma client uses "auth0Id"

-- If you want to actually rename the column in the database, uncomment the following:
-- ALTER TABLE "User" RENAME COLUMN clerk_id TO auth0_id;
-- You would also need to remove the @map("clerk_id") from the Prisma schema

-- For now, no database changes are needed since we're using @map directive
