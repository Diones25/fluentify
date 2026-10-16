-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- AlterTable
ALTER TABLE "Streak" ADD COLUMN     "freezes" INTEGER NOT NULL DEFAULT 1;
