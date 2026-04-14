-- Add simple fraud/suspicious pricing flags to tasks
ALTER TABLE "TASKS"
ADD COLUMN IF NOT EXISTS "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "suspiciousReason" TEXT,
ADD COLUMN IF NOT EXISTS "riskLevel" TEXT;
