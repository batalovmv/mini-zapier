export enum ConnectionType {
  SMTP = 'SMTP',
  TELEGRAM = 'TELEGRAM',
  POSTGRESQL = 'POSTGRESQL',
  WEBHOOK = 'WEBHOOK',
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
