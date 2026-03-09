import axios from 'axios';

interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
}

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
  },
});

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error
      ? error.message
      : 'Unexpected frontend error.';
  }

  const payload = error.response?.data;

  if (Array.isArray(payload?.message) && payload.message.length > 0) {
    return payload.message.join(', ');
  }

  if (typeof payload?.message === 'string' && payload.message.length > 0) {
    return payload.message;
  }

  if (typeof payload?.error === 'string' && payload.error.length > 0) {
    return payload.error;
  }

  return error.message || 'API request failed.';
}
