export enum ActionType {
  HTTP_REQUEST = 'HTTP_REQUEST',
  EMAIL = 'EMAIL',
  TELEGRAM = 'TELEGRAM',
  DB_QUERY = 'DB_QUERY',
  DATA_TRANSFORM = 'DATA_TRANSFORM',
}

export interface HttpRequestActionConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

export interface EmailActionConfig {
  to: string;
  subject: string;
  body: string;
}

export interface TelegramActionConfig {
  chatId: string;
  message: string;
}

export interface DbQueryActionConfig {
  query: string;
  params?: unknown[];
}

export interface DataTransformConfig {
  mode: 'template' | 'mapping';
  /** For mode=template: a single string with {{input.field}} placeholders */
  template?: string;
  /** For mode=mapping: key-value pairs where values are template strings */
  mapping?: Record<string, string>;
}
