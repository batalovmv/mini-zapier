import { apiClient } from './client';

export interface AuthMeResponse {
  authenticated: boolean;
  username: string;
}

export async function login(username: string, password: string): Promise<void> {
  await apiClient.post('/auth/login', { username, password });
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<AuthMeResponse> {
  const { data } = await apiClient.get<AuthMeResponse>('/auth/me');
  return data;
}
