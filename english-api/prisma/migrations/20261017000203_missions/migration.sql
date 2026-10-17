-- CreateTable
CREATE TABLE "MissionRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "score" INTEGER,
    "goals" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionRun_userId_missionId_idx" ON "MissionRun"("userId", "missionId");

-- AddForeignKey
ALTER TABLE "MissionRun" ADD CONSTRAINT "MissionRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
