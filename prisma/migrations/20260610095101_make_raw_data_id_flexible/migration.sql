-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_rawDataId_fkey";

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "rawDataId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_rawDataId_fkey" FOREIGN KEY ("rawDataId") REFERENCES "RawData"("id") ON DELETE SET NULL ON UPDATE CASCADE;
