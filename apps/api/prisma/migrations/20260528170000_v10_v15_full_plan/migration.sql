ALTER TABLE "ImageAsset" ADD COLUMN IF NOT EXISTS "sourceAssetId" TEXT;
DO $$ BEGIN
  ALTER TABLE "ImageAsset" ADD CONSTRAINT "ImageAsset_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "ImageAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ImageCollection" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "workspaceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImageCollection_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "ImageCollection" ADD CONSTRAINT "ImageCollection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ImageCollectionItem" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "imageId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImageCollectionItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ImageCollectionItem_collectionId_imageId_key" ON "ImageCollectionItem"("collectionId", "imageId");
DO $$ BEGIN
  ALTER TABLE "ImageCollectionItem" ADD CONSTRAINT "ImageCollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ImageCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ImageCollectionItem" ADD CONSTRAINT "ImageCollectionItem_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ImageAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CanvasRun" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "status" "TaskStatus" NOT NULL DEFAULT 'QUEUED',
  "label" TEXT,
  "nodesJson" JSONB NOT NULL,
  "edgesJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "workspaceId" TEXT,
  CONSTRAINT "CanvasRun_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "CanvasRun" ADD CONSTRAINT "CanvasRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CanvasProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CanvasRunNode" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "status" "TaskStatus" NOT NULL DEFAULT 'QUEUED',
  "taskId" TEXT,
  "inputJson" JSONB,
  "outputJson" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CanvasRunNode_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "CanvasRunNode" ADD CONSTRAINT "CanvasRunNode_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CanvasRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CanvasRunNode" ADD CONSTRAINT "CanvasRunNode_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "GenerationTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "AgentSuggestion" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "payloadJson" JSONB,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  CONSTRAINT "AgentSuggestion_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "AgentSuggestion" ADD CONSTRAINT "AgentSuggestion_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
