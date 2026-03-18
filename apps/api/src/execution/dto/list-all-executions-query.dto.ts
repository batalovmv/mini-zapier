import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { ExecutionListStatusFilter } from './list-executions-query.dto';

export class ListAllExecutionsQueryDto {
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

  @ApiPropertyOptional({
    example: 'cm123workflow',
    description: 'Optional workflow ID to filter executions.',
  })
  @IsOptional()
  @IsString()
  workflowId?: string;
}
