CREATE TABLE "ai_daily_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date_key" TEXT NOT NULL,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "product_lookup_count" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_daily_usage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_usage_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL DEFAULT 'sarathy_chat',
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "product_lookup" BOOLEAN NOT NULL DEFAULT false,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_daily_usage_user_id_date_key_key" ON "ai_daily_usage"("user_id", "date_key");
CREATE INDEX "ai_daily_usage_user_id_date_key_idx" ON "ai_daily_usage"("user_id", "date_key");
CREATE INDEX "ai_daily_usage_user_id_date_key_message_count_idx" ON "ai_daily_usage"("user_id", "date_key", "message_count");
CREATE INDEX "ai_usage_events_user_id_created_at_idx" ON "ai_usage_events"("user_id", "created_at");
