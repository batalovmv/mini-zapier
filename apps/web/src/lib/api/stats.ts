import { apiClient } from './client';
import { StatsResponse } from './types';

export async function getStats(): Promise<StatsResponse> {
  const response = await apiClient.get<StatsResponse>('/stats');

  return response.data;
}
