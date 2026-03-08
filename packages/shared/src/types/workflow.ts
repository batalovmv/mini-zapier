export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
}

export type NodeKind = 'trigger' | 'action';

export interface WorkflowNodeDto {
  id: string;
  positionX: number;
  positionY: number;
  nodeKind: NodeKind;
  nodeType: string;
  label: string;
  config: Record<string, unknown>;
  connectionId?: string | null;
  retryCount?: number;
  retryBackoff?: number;
  timeoutMs?: number;
}

export interface WorkflowEdgeDto {
  id?: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface WorkflowDto {
  id: string;
  name: string;
  description?: string | null;
  status: WorkflowStatus;
  version: number;
  timezone: string;
  viewport?: Record<string, unknown> | null;
  nodes: WorkflowNodeDto[];
  edges: WorkflowEdgeDto[];
  createdAt: string;
  updatedAt: string;
}
