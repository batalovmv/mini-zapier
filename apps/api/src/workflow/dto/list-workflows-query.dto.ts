import { WorkflowStatus } from '@mini-zapier/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListWorkflowsQueryDto {
  @ApiPropertyOptional({
    example: '1',
    description: '1-based page number.',
  })
  page?: string;

  @ApiPropertyOptional({
    example: '20',
    description: 'Number of items per page.',
  })
  limit?: string;

  @ApiPropertyOptional({
    enum: WorkflowStatus,
    enumName: 'WorkflowStatus',
    example: WorkflowStatus.DRAFT,
  })
  status?: WorkflowStatus;
}
