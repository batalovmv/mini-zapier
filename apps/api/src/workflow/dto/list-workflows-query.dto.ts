import { WorkflowStatus } from '@mini-zapier/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class ListWorkflowsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: '1-based page number.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    enum: WorkflowStatus,
    enumName: 'WorkflowStatus',
    example: WorkflowStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;
}
