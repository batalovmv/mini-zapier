export enum TriggerType {
  WEBHOOK = 'WEBHOOK',
  CRON = 'CRON',
  EMAIL = 'EMAIL',
}

export interface WebhookTriggerConfig {
  /** Connection ID for webhook secret (type=WEBHOOK) */
  connectionId?: string;
}

export interface CronTriggerConfig {
  cronExpression: string;
}

export interface EmailTriggerConfig {
  /** Connection ID for email inbound provider secret */
  connectionId?: string;
}
