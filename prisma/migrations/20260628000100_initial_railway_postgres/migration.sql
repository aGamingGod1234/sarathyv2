-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "home_country" TEXT,
    "current_country" TEXT,
    "user_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primary_currency" TEXT NOT NULL DEFAULT 'SGD',
    "language_preference" TEXT,
    "planning_amount" DOUBLE PRECISION,
    "total_money" DOUBLE PRECISION,
    "money_type" TEXT,
    "responsible_for" TEXT,
    "money_fear" TEXT,
    "income_timing" TEXT,
    "companion_vibe" TEXT NOT NULL DEFAULT 'calm_mentor',
    "plan_tier" TEXT NOT NULL DEFAULT 'free',
    "daily_login_streak" INTEGER NOT NULL DEFAULT 0,
    "last_login_date" TEXT,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "colour_theme" TEXT NOT NULL DEFAULT 'saffron',
    "quiet_mode_until" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "original_amount" DOUBLE PRECISION,
    "original_currency" TEXT,
    "description" TEXT,
    "entry_date" TEXT NOT NULL,
    "payment_method" TEXT,
    "logged_via" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_spending" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '•',
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "due_day" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_spending_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '•',
    "target_amount" DOUBLE PRECISION NOT NULL,
    "current_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TEXT,
    "user_caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "entry_date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittance_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "provider" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "recipient_gets" DOUBLE PRECISION NOT NULL,
    "source_currency" TEXT NOT NULL DEFAULT 'SGD',
    "destination_currency" TEXT NOT NULL DEFAULT 'INR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remittance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "user_type" TEXT,
    "country_from" TEXT,
    "country_now" TEXT,
    "sends_money_home" BOOLEAN NOT NULL DEFAULT false,
    "money_stress" TEXT,
    "current_tool" TEXT,
    "biggest_pain" TEXT,
    "feature_excited" TEXT,
    "wants_beta" BOOLEAN NOT NULL DEFAULT false,
    "referral" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_members" (
    "id" TEXT NOT NULL,
    "circle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circle_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_moments" (
    "id" TEXT NOT NULL,
    "circle_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "reactions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "circle_moments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "budget_entries_user_id_entry_date_idx" ON "budget_entries"("user_id", "entry_date");

-- CreateIndex
CREATE INDEX "fixed_spending_user_id_idx" ON "fixed_spending"("user_id");

-- CreateIndex
CREATE INDEX "goals_user_id_idx" ON "goals"("user_id");

-- CreateIndex
CREATE INDEX "mood_logs_user_id_idx" ON "mood_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mood_logs_user_id_entry_date_key" ON "mood_logs"("user_id", "entry_date");

-- CreateIndex
CREATE INDEX "chat_messages_user_id_created_at_idx" ON "chat_messages"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "remittance_logs_user_id_created_at_idx" ON "remittance_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "waitlist_email_idx" ON "waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "circles_invite_code_key" ON "circles"("invite_code");

-- CreateIndex
CREATE INDEX "circles_created_by_idx" ON "circles"("created_by");

-- CreateIndex
CREATE INDEX "circle_members_user_id_idx" ON "circle_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "circle_members_circle_id_user_id_key" ON "circle_members"("circle_id", "user_id");

-- CreateIndex
CREATE INDEX "circle_moments_circle_id_created_at_idx" ON "circle_moments"("circle_id", "created_at");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

