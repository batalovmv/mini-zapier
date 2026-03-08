import { WorkflowStatus } from '@mini-zapier/shared';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWorkflowStatusDto {
  @ApiProperty({
    enum: WorkflowStatus,
    enumName: 'WorkflowStatus',
    example: WorkflowStatus.ACTIVE,
  })
  status!: WorkflowStatus;
}
