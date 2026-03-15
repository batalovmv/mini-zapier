ALTER TABLE "Workflow" ADD COLUMN "userId" TEXT;
ALTER TABLE "Connection" ADD COLUMN "userId" TEXT;

CREATE INDEX "Workflow_userId_idx" ON "Workflow"("userId");
CREATE INDEX "Connection_userId_idx" ON "Connection"("userId");

ALTER TABLE "Workflow"
ADD CONSTRAINT "Workflow_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "Connection"
ADD CONSTRAINT "Connection_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
