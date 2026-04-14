-- Add bidding window fields for 24h bidding lifecycle
ALTER TABLE "TASKS"
  ADD COLUMN IF NOT EXISTS "biddingStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "biddingEndsAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "TASKS_biddingEndsAt_idx" ON "TASKS"("biddingEndsAt");
