import type {
  ConnectionCatalogResponseDto,
  ConnectionCatalogSort,
  ConnectionCatalogUsageFilter,
  ConnectionDto,
  ConnectionType,
} from '@mini-zapier/shared';

import { apiClient } from './client';
import {
  ConnectionMutationInput,
  UpdateConnectionInput,
} from './types';

export interface ListConnectionsCatalogParams {
  page?: number;
  limit?: number;
  query?: string;
  type?: ConnectionType;
  usage?: ConnectionCatalogUsageFilter;
  sort?: ConnectionCatalogSort;
}

export async function listConnectionsCatalog(
  params: ListConnectionsCatalogParams,
): Promise<ConnectionCatalogResponseDto> {
  const response = await apiClient.get<ConnectionCatalogResponseDto>(
    '/connections/catalog',
    {
      params,
    },
  );

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
