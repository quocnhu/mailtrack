-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "lanePosition" TEXT,
ADD COLUMN     "vehicleId" TEXT,
ALTER COLUMN "payment" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "sequenceIndex" INTEGER NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_bookingId_key" ON "Assignment"("bookingId");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
