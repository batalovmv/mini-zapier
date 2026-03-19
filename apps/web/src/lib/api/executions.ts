import { StepTestRequest, StepTestResponse, WorkflowExecutionDto } from '@mini-zapier/shared';

import { apiClient } from './client';
import {
  AvailableFieldsResponse,
  ExecutionListParams,
  ExecutionListResponse,
  ExecutionStartResponse,
  GlobalExecutionListParams,
  GlobalExecutionListResponse,
} from './types';

export async function executeWorkflow(
  workflowId: string,
  triggerData: unknown,
): Promise<ExecutionStartResponse> {
  const response = await apiClient.post<ExecutionStartResponse>(
    `/workflows/${workflowId}/execute`,
    triggerData,
  );

  return response.data;
}

export async function listWorkflowExecutions(
  workflowId: string,
  params?: ExecutionListParams,
): Promise<ExecutionListResponse> {
  const response = await apiClient.get<ExecutionListResponse>(
    `/workflows/${workflowId}/executions`,
    {
      params,
    },
  );

  return response.data;
}

export async function getAvailableFields(
  workflowId: string,
): Promise<AvailableFieldsResponse> {
  const response = await apiClient.get<AvailableFieldsResponse>(
    `/workflows/${workflowId}/available-fields`,
  );

  return response.data;
}

export async function testStep(
  workflowId: string,
  body: StepTestRequest,
): Promise<StepTestResponse> {
  const response = await apiClient.post<StepTestResponse>(
    `/workflows/${workflowId}/steps/test`,
    body,
  );

  return response.data;
}

export async function listAllExecutions(
  params?: GlobalExecutionListParams,
): Promise<GlobalExecutionListResponse> {
  const response = await apiClient.get<GlobalExecutionListResponse>(
    '/executions',
    { params },
  );

  return response.data;
}

export async function retryExecution(
  executionId: string,
): Promise<ExecutionStartResponse> {
  const response = await apiClient.post<ExecutionStartResponse>(
    `/executions/${executionId}/retry`,
  );

  return response.data;
}

export async function getExecution(
  executionId: string,
): Promise<WorkflowExecutionDto> {
  const response = await apiClient.get<WorkflowExecutionDto>(
    `/executions/${executionId}`,
  );

  return response.data;
}
