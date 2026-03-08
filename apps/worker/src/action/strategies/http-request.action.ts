import { Injectable } from '@nestjs/common';
import { HttpRequestActionConfig } from '@mini-zapier/shared';

import { ActionStrategy } from './action-strategy.interface';

const EXACT_INPUT_TEMPLATE_PATTERN = /^{{\s*input(?:\.([^}]+))?\s*}}$/;
const INPUT_TEMPLATE_PATTERN = /{{\s*input(?:\.([^}]+))?\s*}}/g;
const JSON_CONTENT_TYPE = 'application/json';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function resolveInputPath(inputData: unknown, rawPath?: string): unknown {
  if (!rawPath) {
    return inputData;
  }

  const pathSegments = rawPath
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  let currentValue = inputData;

  for (const segment of pathSegments) {
    if (Array.isArray(currentValue)) {
      const index = Number.parseInt(segment, 10);

      if (!Number.isInteger(index)) {
        return undefined;
      }

      currentValue = currentValue[index];
      continue;
    }

    if (isPlainObject(currentValue)) {
      currentValue = currentValue[segment];
      continue;
    }

    return undefined;
  }

  return currentValue;
}

function stringifyInterpolatedValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

function interpolateValue(value: unknown, inputData: unknown): unknown {
  if (typeof value === 'string') {
    const exactMatch = value.match(EXACT_INPUT_TEMPLATE_PATTERN);

    if (exactMatch) {
      return resolveInputPath(inputData, exactMatch[1]);
    }

    return value.replace(INPUT_TEMPLATE_PATTERN, (_, rawPath?: string) =>
      stringifyInterpolatedValue(resolveInputPath(inputData, rawPath)),
    );
  }

  if (Array.isArray(value)) {
    return value.map((entry) => interpolateValue(entry, inputData));
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      result[key] = interpolateValue(entry, inputData);
    }

    return result;
  }

  return value;
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function readMethod(value: unknown): HttpRequestActionConfig['method'] {
  if (
    value !== 'GET' &&
    value !== 'POST' &&
    value !== 'PUT' &&
    value !== 'PATCH' &&
    value !== 'DELETE'
  ) {
    throw new Error(
      'HTTP request method must be one of GET, POST, PUT, PATCH, DELETE.',
    );
  }

  return value;
}

function readHeaders(value: unknown): Record<string, string> {
  if (value === undefined) {
    return {};
  }

  if (!isPlainObject(value)) {
    throw new Error('HTTP request headers must be an object.');
  }

  const headers: Record<string, string> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new Error(`HTTP request header "${key}" must be a string.`);
    }

    headers[key] = entry;
  }

  return headers;
}

function serializeBody(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  const serializedValue = JSON.stringify(value);

  if (serializedValue === undefined) {
    throw new Error('HTTP request body must be JSON-serializable.');
  }

  return serializedValue;
}

function normalizeResponseHeaders(headers: Headers): Record<string, string> {
  const normalizedHeaders: Record<string, string> = {};

  headers.forEach((value, key) => {
    normalizedHeaders[key] = value;
  });

  return normalizedHeaders;
}

function parseResponseData(
  rawBody: string,
  contentType: string | null,
): unknown {
  if (rawBody.length === 0) {
    return null;
  }

  if (contentType?.toLowerCase().includes(JSON_CONTENT_TYPE)) {
    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  }

  return rawBody;
}

function formatFailedResponseMessage(
  status: number,
  statusText: string,
  rawBody: string,
): string {
  const suffix =
    rawBody.trim().length > 0
      ? rawBody.trim().slice(0, 500)
      : statusText.trim() || 'Request failed.';

  return `HTTP request failed with status ${status}: ${suffix}`;
}

@Injectable()
export class HttpRequestAction implements ActionStrategy {
  async execute(
    config: Record<string, unknown>,
    _credentials: Record<string, string> | null,
    inputData: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const interpolatedConfig = interpolateValue(config, inputData);

    if (!isPlainObject(interpolatedConfig)) {
      throw new Error('HTTP request config must be an object.');
    }

    const url = readRequiredString(interpolatedConfig.url, 'HTTP request url');
    const method = readMethod(interpolatedConfig.method);
    const headers = readHeaders(interpolatedConfig.headers);
    const body = serializeBody(interpolatedConfig.body);

    const response = await fetch(url, {
      method,
      headers,
      body,
      signal,
    });

    const rawBody = await response.text();
    const data = parseResponseData(rawBody, response.headers.get('content-type'));

    if (!response.ok) {
      throw new Error(
        formatFailedResponseMessage(response.status, response.statusText, rawBody),
      );
    }

    return {
      status: response.status,
      headers: normalizeResponseHeaders(response.headers),
      data,
    };
  }
}
