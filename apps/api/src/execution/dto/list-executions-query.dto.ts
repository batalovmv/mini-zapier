import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum ExecutionListStatusFilter {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  IN_PROGRESS = 'IN_PROGRESS',
}

export class ListExecutionsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number starting from 1.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Page size.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    enum: ExecutionListStatusFilter,
    enumName: 'ExecutionListStatusFilter',
    example: ExecutionListStatusFilter.FAILED,
    description:
      'Optional execution status filter. IN_PROGRESS includes PENDING and RUNNING executions.',
  })
  @IsOptional()
  @IsEnum(ExecutionListStatusFilter)
  status?: ExecutionListStatusFilter;
}
