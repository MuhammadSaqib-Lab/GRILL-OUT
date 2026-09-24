-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "loginEmail" TEXT,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "adminMessage" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_loginEmail_key" ON "customers"("loginEmail");

-- CreateIndex
CREATE INDEX "orders_customerId_createdAt_idx" ON "orders"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "reservations_customerId_createdAt_idx" ON "reservations"("customerId", "createdAt");

