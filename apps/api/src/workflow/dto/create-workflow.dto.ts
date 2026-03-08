import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class WorkflowNodeInputDto {
  @ApiProperty({
    example: 'trigger-1',
    description: 'Client-generated node id used by edges.',
  })
  id!: string;

  @ApiProperty({ example: 120 })
  positionX!: number;

  @ApiProperty({ example: 80 })
  positionY!: number;

  @ApiProperty({
    example: 'trigger',
    enum: ['trigger', 'action'],
  })
  nodeKind!: 'trigger' | 'action';

  @ApiProperty({
    example: 'WEBHOOK',
    description: 'TriggerType or ActionType value.',
  })
  nodeType!: string;

  @ApiProperty({
    example: 'Incoming Webhook',
    description: 'Human-readable node label.',
  })
  label!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { path: '/orders' },
    description: 'Node configuration payload.',
  })
  config!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'cm0connection123',
    nullable: true,
    description: 'Optional connection reference stored on the node.',
  })
  connectionId?: string | null;

  @ApiPropertyOptional({
    example: 0,
    description: 'Retry count for action nodes.',
  })
  retryCount?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Retry backoff in milliseconds for action nodes.',
  })
  retryBackoff?: number;

  @ApiPropertyOptional({
    example: 30000,
    nullable: true,
    description: 'Optional timeout in milliseconds for action nodes.',
  })
  timeoutMs?: number | null;
}

class WorkflowEdgeInputDto {
  @ApiPropertyOptional({
    example: 'edge-1',
    description: 'Optional client-generated edge id.',
  })
  id?: string;

  @ApiProperty({
    example: 'trigger-1',
    description: 'Source node id.',
  })
  sourceNodeId!: string;

  @ApiProperty({
    example: 'action-1',
    description: 'Target node id.',
  })
  targetNodeId!: string;

  @ApiPropertyOptional({
    example: 'bottom',
    nullable: true,
    description: 'Optional React Flow source handle.',
  })
  sourceHandle?: string | null;

  @ApiPropertyOptional({
    example: 'top',
    nullable: true,
    description: 'Optional React Flow target handle.',
  })
  targetHandle?: string | null;
}

export class CreateWorkflowDto {
  @ApiProperty({
    example: 'Orders webhook pipeline',
    description: 'Workflow name.',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Receives orders and forwards them.',
    nullable: true,
    description: 'Optional workflow description.',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'UTC',
    description: 'IANA timezone for workflow execution context.',
  })
  timezone?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { x: 0, y: 0, zoom: 1 },
    nullable: true,
    description: 'Editor viewport payload.',
  })
  viewport?: Record<string, unknown> | null;

  @ApiProperty({
    type: () => [WorkflowNodeInputDto],
    description: 'Workflow graph nodes.',
  })
  nodes!: WorkflowNodeInputDto[];

  @ApiProperty({
    type: () => [WorkflowEdgeInputDto],
    description: 'Workflow graph edges.',
  })
  edges!: WorkflowEdgeInputDto[];
}
