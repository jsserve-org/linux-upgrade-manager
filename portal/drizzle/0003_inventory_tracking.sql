ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "package_inventory" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "docker_inventory" jsonb DEFAULT '{"containers":[],"images":[]}'::jsonb NOT NULL;
