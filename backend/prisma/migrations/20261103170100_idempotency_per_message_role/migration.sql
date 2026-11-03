/*
  Warnings:

  - A unique constraint covering the columns `[conversationId,idempotencyKey,role]` on the table `Message` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Message_conversationId_idempotencyKey_key";

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_idempotencyKey_role_key" ON "Message"("conversationId", "idempotencyKey", "role");
