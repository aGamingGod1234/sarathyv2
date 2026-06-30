CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "security_attempts" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMP(3),
  "last_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "security_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "security_attempts_scope_key_key" ON "security_attempts"("scope", "key");
CREATE INDEX "security_attempts_scope_locked_until_idx" ON "security_attempts"("scope", "locked_until");

CREATE TABLE "pending_credential_changes" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "password_hash" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "pending_credential_changes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pending_credential_changes_email_key" ON "pending_credential_changes"("email");
CREATE INDEX "pending_credential_changes_expires_idx" ON "pending_credential_changes"("expires");

ALTER TABLE "circles" ALTER COLUMN "invite_code" SET DEFAULT encode(gen_random_bytes(8), 'hex');
