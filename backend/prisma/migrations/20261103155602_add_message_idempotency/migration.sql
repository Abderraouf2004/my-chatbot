/*
  Warnings:

  - A unique constraint covering the columns `[conversationId,idempotencyKey]` on the table `Message` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_idempotencyKey_key" ON "Message"("conversationId", "idempotencyKey");
