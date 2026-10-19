-- CreateIndex
CREATE INDEX "Conversation_userId_createdAt_idx" ON "Conversation"("userId", "createdAt" DESC);
