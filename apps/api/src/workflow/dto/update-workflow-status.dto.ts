import { WorkflowStatus } from '@mini-zapier/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateWorkflowStatusDto {
  @ApiProperty({
    enum: WorkflowStatus,
    enumName: 'WorkflowStatus',
    example: WorkflowStatus.ACTIVE,
  })
  @IsEnum(WorkflowStatus)
  status!: WorkflowStatus;
}
