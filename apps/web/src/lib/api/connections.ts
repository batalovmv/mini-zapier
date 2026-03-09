import { ConnectionDto } from '@mini-zapier/shared';

import { apiClient } from './client';
import {
  ConnectionMutationInput,
  UpdateConnectionInput,
} from './types';

export async function listConnections(): Promise<ConnectionDto[]> {
  const response = await apiClient.get<ConnectionDto[]>('/connections');

  return response.data;
}

export async function getConnection(connectionId: string): Promise<ConnectionDto> {
  const response = await apiClient.get<ConnectionDto>(
    `/connections/${connectionId}`,
  );

  return response.data;
}

export async function createConnection(
  payload: ConnectionMutationInput,
): Promise<ConnectionDto> {
  const response = await apiClient.post<ConnectionDto>('/connections', payload);

  return response.data;
}

export async function updateConnection(
  connectionId: string,
  payload: UpdateConnectionInput,
): Promise<ConnectionDto> {
  const response = await apiClient.put<ConnectionDto>(
    `/connections/${connectionId}`,
    payload,
  );

  return response.data;
}

export async function deleteConnection(connectionId: string): Promise<void> {
  await apiClient.delete(`/connections/${connectionId}`);
}
