-- DropForeignKey
ALTER TABLE "Classified" DROP CONSTRAINT "Classified_userId_fkey";

-- AlterTable
ALTER TABLE "Classified" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Classified" ADD CONSTRAINT "Classified_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
