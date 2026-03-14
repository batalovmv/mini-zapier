import axios from 'axios';

interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
}

interface ApiErrorMessageOptions {
  unexpectedFrontendError: string;
  apiRequestFailed: string;
}

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
  },
  withCredentials: true,
});

export function getApiErrorMessage(
  error: unknown,
  options?: Partial<ApiErrorMessageOptions>,
): string {
  const unexpectedFrontendError =
    options?.unexpectedFrontendError ?? 'Unexpected frontend error.';
  const apiRequestFailed = options?.apiRequestFailed ?? 'API request failed.';

  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error ? error.message : unexpectedFrontendError;
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

  return error.message || apiRequestFailed;
}
