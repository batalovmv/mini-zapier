import { WorkflowDto } from '@mini-zapier/shared';

import { apiClient } from './client';
import {
  WorkflowListParams,
  WorkflowListResponse,
  WorkflowMutationInput,
  UpdateWorkflowStatusInput,
} from './types';

export async function listWorkflows(
  params?: WorkflowListParams,
): Promise<WorkflowListResponse> {
  const response = await apiClient.get<WorkflowListResponse>('/workflows', {
    params,
  });

  return response.data;
}

export async function getWorkflow(workflowId: string): Promise<WorkflowDto> {
  const response = await apiClient.get<WorkflowDto>(`/workflows/${workflowId}`);

  return response.data;
}

export async function createWorkflow(
  payload: WorkflowMutationInput,
): Promise<WorkflowDto> {
  const response = await apiClient.post<WorkflowDto>('/workflows', payload);

  return response.data;
}

export async function updateWorkflow(
  workflowId: string,
  payload: WorkflowMutationInput,
): Promise<WorkflowDto> {
  const response = await apiClient.put<WorkflowDto>(
    `/workflows/${workflowId}`,
    payload,
  );

  return response.data;
}

export async function updateWorkflowStatus(
  workflowId: string,
  payload: UpdateWorkflowStatusInput,
): Promise<WorkflowDto> {
  const response = await apiClient.patch<WorkflowDto>(
    `/workflows/${workflowId}/status`,
    payload,
  );

  return response.data;
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  await apiClient.delete(`/workflows/${workflowId}`);
}
