import type { ActionType } from './action';
import type { FieldTreeNode } from './execution';

export interface StepTestRequest {
  nodeType: ActionType;
  config: Record<string, unknown>;
  connectionId: string | null;
  inputData: unknown;
}

export type StepTestStatus = 'SUCCESS' | 'FAILED';

export interface StepTestResponse {
  status: StepTestStatus;
  outputData?: unknown;
  outputDataSchema?: FieldTreeNode[];
  errorMessage?: string;
  durationMs: number;
}
