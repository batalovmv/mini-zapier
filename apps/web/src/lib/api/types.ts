import type {
  ConnectionDto,
  ConnectionType,
  WorkflowDto,
  WorkflowExecutionDto,
  WorkflowStatus,
} from '@mini-zapier/shared';

export type {
  ConnectionDto,
  ConnectionType,
  WorkflowDto,
  WorkflowExecutionDto,
  WorkflowStatus,
};

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface WorkflowListParams {
  page?: number;
  limit?: number;
  status?: WorkflowStatus;
}

export interface ExecutionListParams {
  page?: number;
  limit?: number;
}

export interface WorkflowMutationInput {
  name: string;
  description?: string | null;
  timezone?: string;
  viewport?: Record<string, unknown> | null;
  nodes: WorkflowDto['nodes'];
  edges: WorkflowDto['edges'];
}

export interface UpdateWorkflowStatusInput {
  status: WorkflowStatus;
}

export interface ConnectionMutationInput {
  name: string;
  type: ConnectionType;
  credentials: Record<string, string>;
}

export type UpdateConnectionInput = Partial<ConnectionMutationInput>;

export interface ExecutionStartResponse {
  executionId: string;
}

export interface StatsResponse {
  totalWorkflows: number;
  activeWorkflows: number;
  pausedWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  recentExecutions: WorkflowExecutionDto[];
}

export interface AvailableFieldsPosition {
  position: number;
  fields: string[];
}

export type AvailableFieldsEmptyState =
  | 'NO_EXECUTIONS'
  | 'INCOMPATIBLE_EXECUTIONS'
  | 'NO_FIELDS';

export interface AvailableFieldsResponse {
  sourceExecutionId: string | null;
  sourceWorkflowVersion: number | null;
  hasExecutions: boolean;
  emptyState: AvailableFieldsEmptyState | null;
  positions: AvailableFieldsPosition[];
}

export type WorkflowListResponse = PaginatedResponse<WorkflowDto>;
export type ExecutionListResponse = PaginatedResponse<WorkflowExecutionDto>;

