CREATE TABLE "RATINGS" (
  "id" SERIAL NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "taskId" INTEGER NOT NULL,
  "fromUserId" INTEGER NOT NULL,
  "toUserId" INTEGER NOT NULL,
  CONSTRAINT "RATINGS_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RATINGS_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TASKS"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RATINGS_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "USERS"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RATINGS_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "USERS"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "RATINGS_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5),
  CONSTRAINT "RATINGS_from_to_not_same" CHECK ("fromUserId" <> "toUserId")
);

CREATE UNIQUE INDEX "RATINGS_taskId_fromUserId_toUserId_key" ON "RATINGS"("taskId", "fromUserId", "toUserId");
CREATE INDEX "RATINGS_toUserId_createdAt_idx" ON "RATINGS"("toUserId", "createdAt");
CREATE INDEX "RATINGS_taskId_createdAt_idx" ON "RATINGS"("taskId", "createdAt");
