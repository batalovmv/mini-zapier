-- AlterTable
ALTER TABLE "WorkflowExecution" ADD COLUMN "triggerDataSchema" JSONB;

-- AlterTable
ALTER TABLE "ExecutionStepLog" ADD COLUMN "outputDataSchema" JSONB;
