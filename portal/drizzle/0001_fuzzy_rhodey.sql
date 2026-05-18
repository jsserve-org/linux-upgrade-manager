CREATE TABLE IF NOT EXISTS "cve_sync_state" (
	"source" text PRIMARY KEY NOT NULL,
	"last_synced_at" bigint NOT NULL,
	"last_cursor" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cves" (
	"id" text PRIMARY KEY NOT NULL,
	"published_at" bigint NOT NULL,
	"modified_at" bigint NOT NULL,
	"severity" text DEFAULT 'UNKNOWN' NOT NULL,
	"cvss_score" integer,
	"cvss_vector" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"cwes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cpes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source" text DEFAULT 'nvd' NOT NULL,
	"synced_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cves_severity_pub" ON "cves" USING btree ("severity","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cves_published_at" ON "cves" USING btree ("published_at");