import { apiClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: AuthUser;
}

export async function register(email: string, password: string): Promise<void> {
  await apiClient.post('/auth/register', { email, password });
}

export async function login(email: string, password: string): Promise<void> {
  await apiClient.post('/auth/login', { email, password });
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMe(): Promise<AuthMeResponse> {
  const { data } = await apiClient.get<AuthMeResponse>('/auth/me');
  return data;
}
