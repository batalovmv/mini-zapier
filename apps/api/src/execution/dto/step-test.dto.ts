import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionType } from '@mini-zapier/shared';
import { Allow, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class StepTestBodyDto {
  @ApiProperty({
    enum: ActionType,
    enumName: 'ActionType',
    example: ActionType.HTTP_REQUEST,
    description: 'Action node type to test.',
  })
  @IsEnum(ActionType)
  nodeType!: ActionType;

  @ApiProperty({
    example: { url: 'https://example.com', method: 'GET' },
    description: 'Action node config.',
  })
  @IsObject()
  config!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'cm123connection',
    description: 'Connection id for credential lookup.',
  })
  @IsOptional()
  @IsString()
  connectionId?: string | null;

  @ApiProperty({
    example: { key: 'value' },
    description: 'Input data for the step (any JSON value).',
  })
  @Allow()
  inputData: unknown;
}
