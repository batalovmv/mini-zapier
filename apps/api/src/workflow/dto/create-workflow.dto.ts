import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class WorkflowNodeInputDto {
  @ApiProperty({
    example: 'trigger-1',
    description:
      'Client-local node reference used by edges within the request payload. The server generates the persisted database id.',
  })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ example: 120 })
  @IsNumber()
  positionX!: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  positionY!: number;

  @ApiProperty({
    example: 'trigger',
    enum: ['trigger', 'action'],
  })
  @IsIn(['trigger', 'action'])
  nodeKind!: 'trigger' | 'action';

  @ApiProperty({
    example: 'WEBHOOK',
    description: 'TriggerType or ActionType value.',
  })
  @IsString()
  @IsNotEmpty()
  nodeType!: string;

  @ApiProperty({
    example: 'Incoming Webhook',
    description: 'Human-readable node label.',
  })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    example: { path: '/orders' },
    description: 'Node configuration payload.',
  })
  @IsObject()
  config!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'cm0connection123',
    nullable: true,
    description: 'Optional connection reference stored on the node.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  connectionId?: string | null;

  @ApiPropertyOptional({
    example: 0,
    description: 'Retry count for action nodes.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  retryCount?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Retry backoff in milliseconds for action nodes.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  retryBackoff?: number;

  @ApiPropertyOptional({
    example: 30000,
    nullable: true,
    description: 'Optional timeout in milliseconds for action nodes.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutMs?: number | null;
}

export class WorkflowEdgeInputDto {
  @ApiPropertyOptional({
    example: 'edge-1',
    description: 'Optional client-generated edge id.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  id?: string;

  @ApiProperty({
    example: 'trigger-1',
    description: 'Source node id.',
  })
  @IsString()
  @IsNotEmpty()
  sourceNodeId!: string;

  @ApiProperty({
    example: 'action-1',
    description: 'Target node id.',
  })
  @IsString()
  @IsNotEmpty()
  targetNodeId!: string;

  @ApiPropertyOptional({
    example: 'bottom',
    nullable: true,
    description: 'Optional React Flow source handle.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sourceHandle?: string | null;

  @ApiPropertyOptional({
    example: 'top',
    nullable: true,
    description: 'Optional React Flow target handle.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  targetHandle?: string | null;
}

export class CreateWorkflowDto {
  @ApiProperty({
    example: 'Orders webhook pipeline',
    description: 'Workflow name.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Receives orders and forwards them.',
    nullable: true,
    description: 'Optional workflow description.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string | null;

  @ApiPropertyOptional({
    example: 'UTC',
    description: 'IANA timezone for workflow execution context.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    example: { x: 0, y: 0, zoom: 1 },
    nullable: true,
    description: 'Editor viewport payload.',
  })
  @IsOptional()
  @IsObject()
  viewport?: Record<string, unknown> | null;

  @ApiProperty({
    type: () => [WorkflowNodeInputDto],
    description: 'Workflow graph nodes.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeInputDto)
  nodes!: WorkflowNodeInputDto[];

  @ApiProperty({
    type: () => [WorkflowEdgeInputDto],
    description: 'Workflow graph edges.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeInputDto)
  edges!: WorkflowEdgeInputDto[];
}
