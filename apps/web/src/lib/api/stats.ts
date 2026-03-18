import { apiClient } from './client';
import { DashboardSummaryResponse, StatsResponse } from './types';

export async function getStats(): Promise<StatsResponse> {
  const response = await apiClient.get<StatsResponse>('/stats');

  return response.data;
}

export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response =
    await apiClient.get<DashboardSummaryResponse>('/stats/dashboard');

  return response.data;
}
