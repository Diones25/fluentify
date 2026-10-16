-- CreateTable
CREATE TABLE "LevelHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "from" "Level" NOT NULL,
    "to" "Level" NOT NULL,
    "avgScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LevelHistory_userId_createdAt_idx" ON "LevelHistory"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "LevelHistory" ADD CONSTRAINT "LevelHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
