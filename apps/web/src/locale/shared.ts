import type {
  ConnectionType,
  ExecutionStepLogDto,
  WorkflowDto,
  WorkflowExecutionDto,
} from '@mini-zapier/shared';

export function formatCount(locale: string, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function pluralizeEn(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return count === 1 ? singular : plural;
}

export function pluralizeRu(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }

  return many;
}

export type WorkflowStatus = WorkflowDto['status'];
export type ExecutionStatus = WorkflowExecutionDto['status'];
export type StepStatus = ExecutionStepLogDto['status'];
export type ConnectionTypeLabelMap = Record<ConnectionType, string>;
