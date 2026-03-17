import axios from 'axios';

interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
}

interface ApiErrorMessageOptions {
  unexpectedFrontendError: string;
  apiRequestFailed: string;
  missingApiRoute: string;
}

const missingApiRoutePattern = /^Cannot (GET|POST|PUT|PATCH|DELETE) \//i;

function normalizeApiMessage(
  value: string,
  missingApiRoute: string,
): string | null {
  const normalized = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length === 0) {
    return null;
  }

  if (missingApiRoutePattern.test(normalized)) {
    return missingApiRoute;
  }

  return normalized;
}

function getApiPayloadMessage(payload: unknown): string | null {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const typedPayload = payload as ApiErrorPayload;

  if (
    Array.isArray(typedPayload.message) &&
    typedPayload.message.length > 0
  ) {
    return typedPayload.message.join(', ');
  }

  if (
    typeof typedPayload.message === 'string' &&
    typedPayload.message.length > 0
  ) {
    return typedPayload.message;
  }

  if (typeof typedPayload.error === 'string' && typedPayload.error.length > 0) {
    return typedPayload.error;
  }

  return null;
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
  const missingApiRoute =
    options?.missingApiRoute ??
    'The current API deployment does not support this route.';

  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error ? error.message : unexpectedFrontendError;
  }

  const payloadMessage = getApiPayloadMessage(error.response?.data);
  const normalizedPayloadMessage = payloadMessage
    ? normalizeApiMessage(payloadMessage, missingApiRoute)
    : null;

  if (normalizedPayloadMessage) {
    return normalizedPayloadMessage;
  }

  const normalizedErrorMessage = error.message
    ? normalizeApiMessage(error.message, missingApiRoute)
    : null;

  return normalizedErrorMessage ?? apiRequestFailed;
}

export function isMissingApiRouteError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 404) {
    return false;
  }

  const payloadMessage = getApiPayloadMessage(error.response?.data);
  if (payloadMessage && missingApiRoutePattern.test(payloadMessage.trim())) {
    return true;
  }

  return false;
}
