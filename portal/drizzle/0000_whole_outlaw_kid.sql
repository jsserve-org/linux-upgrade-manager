CREATE TABLE IF NOT EXISTS "enroll_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"created_at" bigint NOT NULL,
	"used" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instances" (
	"id" text PRIMARY KEY NOT NULL,
	"hostname" text NOT NULL,
	"agent_token" text NOT NULL,
	"os_name" text,
	"os_version" text,
	"kernel" text,
	"arch" text,
	"pkg_manager" text,
	"updates_available" integer DEFAULT 0 NOT NULL,
	"security_updates" integer DEFAULT 0 NOT NULL,
	"last_seen" bigint,
	"enrolled_at" bigint NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "instances_agent_token_unique" UNIQUE("agent_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" bigint NOT NULL,
	"picked_at" bigint,
	"finished_at" bigint,
	"exit_code" integer,
	"stdout" text,
	"stderr" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_instance_id_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."instances"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_jobs_instance_status" ON "jobs" USING btree ("instance_id","status");