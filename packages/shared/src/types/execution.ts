export interface FieldTreeNode {
  key: string;
  path: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  children?: FieldTreeNode[];
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum StepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export interface ExecutionStepLogDto {
  id: string;
  executionId: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: StepStatus;
  inputData?: unknown;
  outputData?: unknown;
  errorMessage?: string | null;
  retryAttempt: number;
  truncated: boolean;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  createdAt: string;
}

export interface WorkflowExecutionDto {
  id: string;
  workflowId: string;
  workflowVersion: number;
  status: ExecutionStatus;
  triggerData?: unknown;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  stepLogs?: ExecutionStepLogDto[];
}
