export enum ConnectionType {
  SMTP = 'SMTP',
  TELEGRAM = 'TELEGRAM',
  POSTGRESQL = 'POSTGRESQL',
  WEBHOOK = 'WEBHOOK',
}

export enum ConnectionCatalogUsageFilter {
  ALL = 'ALL',
  USED = 'USED',
  UNUSED = 'UNUSED',
}

export enum ConnectionCatalogSort {
  UPDATED_DESC = 'UPDATED_DESC',
  UPDATED_ASC = 'UPDATED_ASC',
  NAME_ASC = 'NAME_ASC',
  NAME_DESC = 'NAME_DESC',
  USAGE_DESC = 'USAGE_DESC',
}

export interface ConnectionDto {
  id: string;
  name: string;
  type: ConnectionType;
  /** Always masked in API responses */
  credentials: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionCatalogItemDto {
  id: string;
  name: string;
  type: ConnectionType;
  usageCount: number;
  credentialFieldCount: number;
  updatedAt: string;
}

export interface ConnectionCatalogResponseDto {
  items: ConnectionCatalogItemDto[];
  total: number;
  page: number;
  limit: number;
}

export interface ConnectionTestResultDto {
  success: boolean;
  message?: string;
  durationMs: number;
}
