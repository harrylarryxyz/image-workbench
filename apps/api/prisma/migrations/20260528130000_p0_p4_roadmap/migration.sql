CREATE TABLE IF NOT EXISTS "Workspace" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_slug_key" ON "Workspace"("slug");

CREATE TABLE IF NOT EXISTS "UserSession" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "label" TEXT,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3),
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserSession_tokenHash_key" ON "UserSession"("tokenHash");
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Workspace" ("id", "slug", "name", "updatedAt") VALUES ('default', 'default', 'Default Workspace', CURRENT_TIMESTAMP) ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "GenerationTask" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "GenerationTask" ADD COLUMN IF NOT EXISTS "estimatedCostUsd" DECIMAL(10,6);
ALTER TABLE "ImageAsset" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "ImageAsset" ADD COLUMN IF NOT EXISTS "favorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ImageAsset" ADD COLUMN IF NOT EXISTS "rating" INTEGER;
ALTER TABLE "ImageAsset" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CanvasProject" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "CanvasProject" ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PromptPreset" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

UPDATE "ProviderProfile" SET "workspaceId"='default' WHERE "workspaceId" IS NULL;
UPDATE "GenerationTask" SET "workspaceId"='default' WHERE "workspaceId" IS NULL;
UPDATE "ImageAsset" SET "workspaceId"='default' WHERE "workspaceId" IS NULL;
UPDATE "CanvasProject" SET "workspaceId"='default' WHERE "workspaceId" IS NULL;
UPDATE "PromptPreset" SET "workspaceId"='default' WHERE "workspaceId" IS NULL;

DO $$ BEGIN
  ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "GenerationTask" ADD CONSTRAINT "GenerationTask_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CanvasProject" ADD CONSTRAINT "CanvasProject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PromptPreset" ADD CONSTRAINT "PromptPreset_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CanvasSnapshot" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "label" TEXT,
  "nodesJson" JSONB NOT NULL,
  "edgesJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CanvasSnapshot_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "CanvasSnapshot" ADD CONSTRAINT "CanvasSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CanvasProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
