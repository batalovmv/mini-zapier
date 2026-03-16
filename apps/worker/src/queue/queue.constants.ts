export const WORKFLOW_EXECUTION_QUEUE_NAME = 'workflow-execution';
export const STEP_TEST_QUEUE_NAME = 'step-test';

export interface WorkflowExecutionJobData {
  executionId: string;
}

export interface StepTestJobData {
  nodeType: string;
  config: Record<string, unknown>;
  connectionId: string | null;
  inputData: unknown;
}
