/*
  Migration: Update schema to remove assistant type and add document source support

  - Remove assistant type field (replaced with direct assistant IDs)
  - Add document source tracking (PDF files, website URLs)
  - Handle existing data migration

*/

-- First, add new columns with default values to documents table
ALTER TABLE "public"."documents"
ADD COLUMN "fileSize" INTEGER,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "sourceType" TEXT NOT NULL DEFAULT 'pdf',
ADD COLUMN "sourceUrl" TEXT;

-- Update existing documents to have proper source info
-- Assume all existing documents are PDFs since that was the only supported type
UPDATE "public"."documents"
SET "sourceType" = 'pdf',
    "mimeType" = 'application/pdf'
WHERE "sourceType" = 'pdf';

-- Now we need to handle the assistant type removal and ID migration
-- First, let's update assistant IDs to use our new predefined IDs
-- We'll map existing types to our new ID scheme

-- Store the mapping of old IDs to new IDs temporarily
CREATE TEMP TABLE assistant_id_mapping AS
SELECT
  id as old_id,
  CASE
    WHEN type = 'legal' THEN 'legal-assistant-001'
    WHEN type = 'tax' THEN 'tax-assistant-001'
    WHEN type = 'general' THEN 'general-assistant-001'
    ELSE 'general-assistant-001'  -- fallback
  END as new_id,
  type
FROM "public"."assistants";

-- Create new assistants with proper IDs
INSERT INTO "public"."assistants" (id, name, description, "systemPrompt", "createdAt", "updatedAt")
SELECT
  CASE
    WHEN type = 'legal' THEN 'legal-assistant-001'
    WHEN type = 'tax' THEN 'tax-assistant-001'
    WHEN type = 'general' THEN 'general-assistant-001'
    ELSE 'general-assistant-001'
  END,
  name,
  description,
  "systemPrompt",
  "createdAt",
  "updatedAt"
FROM "public"."assistants"
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  "systemPrompt" = EXCLUDED."systemPrompt",
  "updatedAt" = EXCLUDED."updatedAt";

-- Update documents to reference new assistant IDs
UPDATE "public"."documents"
SET "assistantId" = mapping.new_id
FROM assistant_id_mapping mapping
WHERE "public"."documents"."assistantId" = mapping.old_id;

-- Update chat sessions to reference new assistant IDs
UPDATE "public"."chat_sessions"
SET "assistantId" = mapping.new_id
FROM assistant_id_mapping mapping
WHERE "public"."chat_sessions"."assistantId" = mapping.old_id;

-- Delete old assistants (those that don't have our new ID format)
DELETE FROM "public"."assistants"
WHERE id NOT IN ('legal-assistant-001', 'tax-assistant-001', 'general-assistant-001');

-- Drop the unique index on type since we're removing the column
DROP INDEX IF EXISTS "public"."assistants_type_key";

-- Finally, remove the type column from assistants table
ALTER TABLE "public"."assistants" DROP COLUMN IF EXISTS "type";
